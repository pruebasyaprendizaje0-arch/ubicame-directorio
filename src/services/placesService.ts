import { Lugar, PlaceFilters } from '@/types/lugar';
import localLugares from '@/data/lugares.json';
import { getDbPool } from '@/lib/db';
import {
  calculateDistanceKm,
  PROVINCIAS_ECUADOR,
  COMUNAS_LOCALIDADES_SANTA_ELENA,
  PARROQUIAS_SANTA_ELENA,
  CANTONES_SANTA_ELENA,
  getCoordinatesForPlace,
} from '@/lib/geo';
import fs from 'fs';
import path from 'path';
import { fetchUbicameCcBusinesses } from '@/lib/ubicameSync';

let cachedUbicameBusinesses: { data: Lugar[]; timestamp: number } | null = null;
const UBICAME_CACHE_TTL_MS = 5000; // 5 segundos de caché en memoria para sincronización en tiempo real

export function invalidateUbicameCache(): void {
  cachedUbicameBusinesses = null;
}

async function getLiveUbicameBusinesses(): Promise<Lugar[]> {
  const now = Date.now();
  if (cachedUbicameBusinesses && now - cachedUbicameBusinesses.timestamp < UBICAME_CACHE_TTL_MS) {
    return cachedUbicameBusinesses.data;
  }
  try {
    const live = await fetchUbicameCcBusinesses();
    if (live && live.length > 0) {
      cachedUbicameBusinesses = { data: live, timestamp: now };
      return live;
    }
  } catch (err) {
    // Si no está disponible, continuar silenciosamente
  }
  return cachedUbicameBusinesses?.data || [];
}

/**
 * Función de ordenamiento requerida por las reglas de negocio:
 * 1. Si está activo "cerca_de_mi", ordena por distancia ascendente
 * 2. Si no, prioridad ASC (1 = Cliente ubicame.cc arriba)
 * 3. es_referencia DESC (Puntos de referencia antes que regulares del mismo rango)
 * 4. nombre ASC (Alfabético)
 */
export function sortLugares(list: Lugar[], cercaDeMi: boolean = false): Lugar[] {
  if (cercaDeMi) {
    return [...list].sort((a, b) => {
      const distA = a.distancia_km ?? 999999;
      const distB = b.distancia_km ?? 999999;
      if (Math.abs(distA - distB) > 0.05) {
        return distA - distB;
      }
      return a.prioridad - b.prioridad;
    });
  }

  return [...list].sort((a, b) => {
    if (a.prioridad !== b.prioridad) {
      return a.prioridad - b.prioridad;
    }
    if (a.es_referencia !== b.es_referencia) {
      return a.es_referencia ? -1 : 1;
    }
    return a.nombre.localeCompare(b.nombre, 'es');
  });
}

/**
 * Helper para leer los lugares del archivo JSON local de forma fresca
 */
function readLocalFile(): Lugar[] {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'lugares.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Error al leer src/data/lugares.json:', err);
  }
  return localLugares as Lugar[];
}

/**
 * Helper para escribir en el archivo JSON local
 */
function writeLocalFile(lugares: Lugar[]): void {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'lugares.json');
    fs.writeFileSync(filePath, JSON.stringify(lugares, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error al guardar en src/data/lugares.json:', err);
  }
}

/**
 * Toggle de entorno:
 * Si existe DATABASE_URL y no se fuerza modo local, consulta PostgreSQL.
 */
const shouldUsePostgres = Boolean(
  process.env.DATABASE_URL && process.env.USE_LOCAL_DATA !== 'true'
);

/**
 * Obtener todos los lugares activos aplicando filtros jerárquicos y/o "Cerca de mí"
 */
export async function getLugares(filters?: PlaceFilters): Promise<Lugar[]> {
  let results: Lugar[] = [];

  if (shouldUsePostgres) {
    try {
      results = await getLugaresFromPostgres(filters);
    } catch (err) {
      console.warn('⚠️ [placesService] Error conectando a PostgreSQL, usando fallback local:', err);
      results = readLocalFile().filter(p => p.estado === 'activo');
    }
  } else {
    results = readLocalFile().filter(p => p.estado === 'activo');
  }

  // Fusionar con negocios en vivo de ubicame.cc si están disponibles
  try {
    const liveUbicame = await getLiveUbicameBusinesses();
    if (liveUbicame.length > 0) {
      const map = new Map<string, Lugar>();
      results.forEach(p => map.set(p.id_slug, p));
      liveUbicame.forEach(u => {
        if (u.estado === 'activo') {
          const existing = map.get(u.id_slug);
          if (existing) {
            // Unir dando prioridad estricta a las coordenadas satelitales y ediciones locales
            map.set(u.id_slug, {
              ...u,
              ...existing,
              latitud: existing.latitud !== undefined && !isNaN(existing.latitud) ? existing.latitud : u.latitud,
              longitud: existing.longitud !== undefined && !isNaN(existing.longitud) ? existing.longitud : u.longitud,
              foto_url: existing.foto_url || u.foto_url,
              descripcion: existing.descripcion || u.descripcion,
              email_propietario: existing.email_propietario || u.email_propietario,
              nombre_propietario: existing.nombre_propietario || u.nombre_propietario,
              campanas: u.campanas && u.campanas.length > 0 ? u.campanas : existing.campanas,
              tiene_promo: u.tiene_promo !== undefined ? u.tiene_promo : existing.tiene_promo,
              campana_destacada: u.campana_destacada || existing.campana_destacada,
            });
          } else {
            map.set(u.id_slug, u);
          }
        }
      });
      results = Array.from(map.values());
    }
  } catch (e) {
    // Continuar con los lugares locales
  }

function normalizeText(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

  // Filtrado en memoria (aplica siempre para fallback o refinamiento)
  if (filters?.search) {
    const q = normalizeText(filters.search);
    results = results.filter(p => {
      const target = normalizeText(
        `${p.nombre} ${p.tipo} ${p.provincia || ''} ${p.ciudad || ''} ${p.zona || ''} ${p.parroquia || ''} ${p.comuna || ''} ${p.descripcion || ''}`
      );
      return target.includes(q);
    });
  }

  if (filters?.provincia) {
    const prov = normalizeText(filters.provincia);
    results = results.filter(p => normalizeText(p.provincia) === prov);
  }

  if (filters?.canton || filters?.ciudad) {
    const cant = normalizeText(filters.canton || filters.ciudad);
    results = results.filter(p => normalizeText(p.ciudad) === cant);
  }

  if (filters?.parroquia) {
    const parr = normalizeText(filters.parroquia);
    results = results.filter(
      p => normalizeText(p.parroquia) === parr || normalizeText(p.zona) === parr
    );
  }

  if (filters?.comuna || filters?.zona) {
    const com = normalizeText(filters.comuna || filters.zona);
    results = results.filter(
      p =>
        normalizeText(p.zona) === com ||
        normalizeText(p.comuna) === com ||
        normalizeText(p.nombre).includes(com)
    );
  }

  if (filters?.tipo) {
    results = results.filter(p => normalizeText(p.tipo) === normalizeText(filters.tipo));
  }

  if (filters?.solo_ubicame_cc) {
    results = results.filter(p => p.prioridad === 1 || p.origen === 'ubicame_cc');
  }

  if (filters?.solo_promos) {
    results = results.filter(p => p.tiene_promo || (p.campanas && p.campanas.length > 0));
  }

  // Cálculo de distancia si se solicitó "Cerca de mí" con coordenadas del usuario
  const hasUserCoords =
    typeof filters?.user_lat === 'number' &&
    typeof filters?.user_lng === 'number' &&
    !isNaN(filters.user_lat) &&
    !isNaN(filters.user_lng);

  if (hasUserCoords) {
    results = results.map(place => {
      const dist = calculateDistanceKm(
        filters!.user_lat!,
        filters!.user_lng!,
        place.latitud,
        place.longitud
      );
      return {
        ...place,
        distancia_km: dist,
      };
    });
  }

  return sortLugares(results, Boolean(filters?.cerca_de_mi && hasUserCoords));
}

/**
 * Obtener TODOS los lugares para el Super Admin (incluye pendientes e inactivos)
 */
export async function getAllAdminLugares(): Promise<Lugar[]> {
  let results: Lugar[] = [];

  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
      const res = await pool.query(`
        SELECT id_slug, nombre, tipo, icono, provincia, ciudad, zona,
               latitud, longitud, es_referencia, es_servicio, prioridad,
               origen, whatsapp, url_perfil, estado, descripcion, foto_url
        FROM lugares
        ORDER BY prioridad ASC, es_referencia DESC, nombre ASC
      `);
      results = res.rows.map(mapRowToLugar);
    } catch (err) {
      console.warn('Error al consultar lugares admin en Postgres, usando fallback local:', err);
      results = readLocalFile();
    }
  } else {
    results = readLocalFile();
  }

  try {
    const liveUbicame = await getLiveUbicameBusinesses();
    if (liveUbicame.length > 0) {
      const map = new Map<string, Lugar>();
      results.forEach(p => map.set(p.id_slug, p));
      liveUbicame.forEach(u => {
        const existing = map.get(u.id_slug);
        if (existing) {
          map.set(u.id_slug, {
            ...u,
            ...existing,
            latitud: existing.latitud !== undefined && !isNaN(existing.latitud) ? existing.latitud : u.latitud,
            longitud: existing.longitud !== undefined && !isNaN(existing.longitud) ? existing.longitud : u.longitud,
            exactitud_gps: existing.exactitud_gps || u.exactitud_gps,
            foto_url: existing.foto_url || u.foto_url,
            descripcion: existing.descripcion || u.descripcion,
            campanas: u.campanas && u.campanas.length > 0 ? u.campanas : existing.campanas,
            tiene_promo: u.tiene_promo !== undefined ? u.tiene_promo : existing.tiene_promo,
            campana_destacada: u.campana_destacada || existing.campana_destacada,
          });
        } else {
          map.set(u.id_slug, u);
        }
      });
      results = Array.from(map.values());
    }
  } catch (e) {}

  return sortLugares(results);
}

/**
 * Catálogos geográficos únicos para alimentar los selectores de búsqueda
 */
export async function getProvincias(): Promise<string[]> {
  const set = new Set<string>(PROVINCIAS_ECUADOR);
  const lugares = await getAllAdminLugares();
  lugares.forEach(p => { if (p.provincia) set.add(p.provincia); });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

export async function getCantones(): Promise<string[]> {
  const lugares = await getAllAdminLugares();
  const set = new Set<string>(CANTONES_SANTA_ELENA);
  lugares.forEach(p => { if (p.ciudad) set.add(p.ciudad); });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

export async function getParroquias(): Promise<string[]> {
  return [...PARROQUIAS_SANTA_ELENA].sort((a, b) => a.localeCompare(b, 'es'));
}

export async function getZonas(): Promise<string[]> {
  const lugares = await getAllAdminLugares();
  const set = new Set<string>(COMUNAS_LOCALIDADES_SANTA_ELENA);
  lugares.forEach(p => { if (p.zona) set.add(p.zona); });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtener un lugar por su id_slug único
 */
export async function getLugarBySlug(slug: string): Promise<Lugar | null> {
  let basePlace: Lugar | null = null;

  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
      const res = await pool.query(
        `SELECT * FROM lugares WHERE id_slug = $1 LIMIT 1`,
        [slug]
      );
      if (res.rows.length > 0) basePlace = mapRowToLugar(res.rows[0]);
    } catch (err) {
      console.warn('Error en getLugarBySlug Postgres, usando local:', err);
    }
  }

  if (!basePlace) {
    const lugares = readLocalFile();
    basePlace = lugares.find(p => p.id_slug === slug) || null;
  }

  try {
    const liveUbicame = await getLiveUbicameBusinesses();
    const liveMatch = liveUbicame.find(p => p.id_slug === slug);
    if (liveMatch) {
      if (basePlace) {
        return {
          ...liveMatch,
          ...basePlace,
          latitud: basePlace.latitud !== undefined && !isNaN(basePlace.latitud) ? basePlace.latitud : liveMatch.latitud,
          longitud: basePlace.longitud !== undefined && !isNaN(basePlace.longitud) ? basePlace.longitud : liveMatch.longitud,
          exactitud_gps: basePlace.exactitud_gps || liveMatch.exactitud_gps,
          foto_url: basePlace.foto_url || liveMatch.foto_url,
          descripcion: basePlace.descripcion || liveMatch.descripcion,
          email_propietario: basePlace.email_propietario || liveMatch.email_propietario,
          nombre_propietario: basePlace.nombre_propietario || liveMatch.nombre_propietario,
          campanas: liveMatch.campanas && liveMatch.campanas.length > 0 ? liveMatch.campanas : basePlace.campanas,
          tiene_promo: liveMatch.tiene_promo !== undefined ? liveMatch.tiene_promo : basePlace.tiene_promo,
          campana_destacada: liveMatch.campana_destacada || basePlace.campana_destacada,
        };
      }
      return liveMatch;
    }
  } catch (e) {}

  return basePlace;
}

/**
/**
 * Intento de migración idempotente para asegurar columnas territoriales en PostgreSQL
 */
let schemaMigrationAttempted = false;
async function ensurePostgresColumns(pool: any): Promise<void> {
  if (schemaMigrationAttempted) return;
  schemaMigrationAttempted = true;
  try {
    await pool.query(`
      ALTER TABLE lugares 
      ADD COLUMN IF NOT EXISTS parroquia VARCHAR(150),
      ADD COLUMN IF NOT EXISTS comuna VARCHAR(150);
    `);
  } catch (err: any) {
    console.warn('⚠️ [PostgreSQL] Nota: Columnas parroquia/comuna no pudieron ser añadidas mediante ALTER TABLE:', err?.message || err);
  }
}

/**
 * Actualizar un negocio o punto de referencia existente (Super Admin)
 * Garantiza que SIEMPRE se pueda editar, sin importar si faltan columnas en PostgreSQL,
 * si el lugar vino de ubicame.cc en vivo (ej. sazon-manabita), o si la BD tiene problemas.
 */
export async function updateLugar(slug: string, updates: Partial<Lugar>): Promise<Lugar | null> {
  // 1. Obtener datos actuales del lugar (sea de Postgres, local o ubicame.cc en vivo)
  const current = await getLugarBySlug(slug);

  // Sincronizar zona y comuna
  if (updates.comuna && !updates.zona) {
    updates.zona = updates.comuna;
  } else if (updates.zona && !updates.comuna) {
    updates.comuna = updates.zona;
  }

  // Recalcular coordenadas si se modificó ubicación o si vienen nuevas
  if (updates.latitud !== undefined || updates.longitud !== undefined || updates.zona || updates.ciudad || updates.provincia) {
    const coords = getCoordinatesForPlace(
      updates.zona || updates.comuna || current?.zona,
      updates.parroquia || current?.parroquia,
      updates.ciudad || current?.ciudad,
      updates.provincia || current?.provincia,
      updates.latitud !== undefined ? updates.latitud : current?.latitud,
      updates.longitud !== undefined ? updates.longitud : current?.longitud,
      slug
    );
    updates.latitud = coords.lat;
    updates.longitud = coords.lng;
  }

  if (updates.email_propietario && (!updates.descripcion || !updates.descripcion.includes(updates.email_propietario))) {
    const oldDesc = updates.descripcion || current?.descripcion || '';
    if (!oldDesc.includes(updates.email_propietario)) {
      updates.descripcion = `${oldDesc} | Cuenta Google: ${updates.nombre_propietario || ''} <${updates.email_propietario}> (Verificada)`.trim();
    }
  }

  let postgresUpdatedPlace: Lugar | null = null;

  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
      await ensurePostgresColumns(pool);

      const baseColumns = [
        'nombre', 'tipo', 'icono', 'provincia', 'ciudad', 'zona',
        'latitud', 'longitud', 'es_referencia', 'es_servicio', 'prioridad',
        'origen', 'whatsapp', 'url_perfil', 'estado', 'descripcion', 'foto_url'
      ];

      // Función para ejecutar UPDATE con o sin columnas territoriales
      const tryUpdateQuery = async (includeTerritorial: boolean) => {
        const allowed = includeTerritorial
          ? [...baseColumns, 'parroquia', 'comuna']
          : baseColumns;

        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        for (const key of allowed) {
          if ((updates as any)[key] !== undefined) {
            fields.push(`${key} = $${idx++}`);
            values.push((updates as any)[key]);
          }
        }

        if (fields.length === 0) return null;

        values.push(slug);
        const query = `
          UPDATE lugares
          SET ${fields.join(', ')}
          WHERE id_slug = $${idx}
          RETURNING *;
        `;
        return pool.query(query, values);
      };

      let res: any = null;
      try {
        res = await tryUpdateQuery(true);
      } catch (colErr: any) {
        // Error 42703: undefined_column (ej: column "parroquia" does not exist)
        if (colErr?.code === '42703' || colErr?.message?.includes('parroquia') || colErr?.message?.includes('comuna') || colErr?.message?.includes('does not exist')) {
          console.warn('⚠️ [PostgreSQL] Columnas territoriales no existen en tabla lugares, actualizando con campos estándar.');
          res = await tryUpdateQuery(false);
        } else {
          throw colErr;
        }
      }

      if (res && res.rows && res.rows.length > 0) {
        postgresUpdatedPlace = mapRowToLugar(res.rows[0]);
      } else {
        // CASO CRÍTICO: El lugar no existía en la tabla PostgreSQL (ej. sazon-manabita traído de ubicame.cc en vivo)
        // Lo insertamos en PostgreSQL con UPSERT para que quede guardado permanentemente
        const mergedPlace: Lugar = {
          ...(current || {
            id_slug: slug,
            nombre: updates.nombre || slug,
            tipo: updates.tipo || 'Gastronomía',
            icono: updates.icono || 'restaurante.svg',
            provincia: updates.provincia || 'Santa Elena',
            ciudad: updates.ciudad || 'Santa Elena',
            zona: updates.zona || updates.comuna || 'Olón',
            latitud: updates.latitud ?? -1.82,
            longitud: updates.longitud ?? -80.75,
            es_referencia: false,
            es_servicio: false,
            prioridad: 2,
            origen: 'directorio_info',
            estado: 'activo',
          }),
          ...updates,
          id_slug: slug,
        };

        const tryInsertQuery = async (includeTerritorial: boolean) => {
          if (includeTerritorial) {
            const insertQuery = `
              INSERT INTO lugares (
                id_slug, nombre, tipo, icono, provincia, ciudad, zona, parroquia, comuna,
                latitud, longitud, es_referencia, es_servicio, prioridad,
                origen, whatsapp, url_perfil, estado, descripcion, foto_url
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20
              )
              ON CONFLICT (id_slug) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                tipo = EXCLUDED.tipo,
                icono = EXCLUDED.icono,
                provincia = EXCLUDED.provincia,
                ciudad = EXCLUDED.ciudad,
                zona = EXCLUDED.zona,
                parroquia = EXCLUDED.parroquia,
                comuna = EXCLUDED.comuna,
                latitud = EXCLUDED.latitud,
                longitud = EXCLUDED.longitud,
                es_referencia = EXCLUDED.es_referencia,
                es_servicio = EXCLUDED.es_servicio,
                prioridad = EXCLUDED.prioridad,
                origen = EXCLUDED.origen,
                whatsapp = EXCLUDED.whatsapp,
                url_perfil = EXCLUDED.url_perfil,
                estado = EXCLUDED.estado,
                descripcion = EXCLUDED.descripcion,
                foto_url = EXCLUDED.foto_url
              RETURNING *;
            `;
            const values = [
              mergedPlace.id_slug, mergedPlace.nombre, mergedPlace.tipo, mergedPlace.icono || 'lugar.svg',
              mergedPlace.provincia, mergedPlace.ciudad, mergedPlace.zona,
              mergedPlace.parroquia || null, mergedPlace.comuna || mergedPlace.zona || null,
              mergedPlace.latitud, mergedPlace.longitud,
              Boolean(mergedPlace.es_referencia), Boolean(mergedPlace.es_servicio),
              mergedPlace.prioridad || 2, mergedPlace.origen || 'directorio_info',
              mergedPlace.whatsapp || null, mergedPlace.url_perfil || null,
              mergedPlace.estado || 'activo', mergedPlace.descripcion || null,
              mergedPlace.foto_url || null,
            ];
            return pool.query(insertQuery, values);
          } else {
            const insertQuery = `
              INSERT INTO lugares (
                id_slug, nombre, tipo, icono, provincia, ciudad, zona,
                latitud, longitud, es_referencia, es_servicio, prioridad,
                origen, whatsapp, url_perfil, estado, descripcion, foto_url
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18
              )
              ON CONFLICT (id_slug) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                tipo = EXCLUDED.tipo,
                icono = EXCLUDED.icono,
                provincia = EXCLUDED.provincia,
                ciudad = EXCLUDED.ciudad,
                zona = EXCLUDED.zona,
                latitud = EXCLUDED.latitud,
                longitud = EXCLUDED.longitud,
                es_referencia = EXCLUDED.es_referencia,
                es_servicio = EXCLUDED.es_servicio,
                prioridad = EXCLUDED.prioridad,
                origen = EXCLUDED.origen,
                whatsapp = EXCLUDED.whatsapp,
                url_perfil = EXCLUDED.url_perfil,
                estado = EXCLUDED.estado,
                descripcion = EXCLUDED.descripcion,
                foto_url = EXCLUDED.foto_url
              RETURNING *;
            `;
            const values = [
              mergedPlace.id_slug, mergedPlace.nombre, mergedPlace.tipo, mergedPlace.icono || 'lugar.svg',
              mergedPlace.provincia, mergedPlace.ciudad, mergedPlace.zona,
              mergedPlace.latitud, mergedPlace.longitud,
              Boolean(mergedPlace.es_referencia), Boolean(mergedPlace.es_servicio),
              mergedPlace.prioridad || 2, mergedPlace.origen || 'directorio_info',
              mergedPlace.whatsapp || null, mergedPlace.url_perfil || null,
              mergedPlace.estado || 'activo', mergedPlace.descripcion || null,
              mergedPlace.foto_url || null,
            ];
            return pool.query(insertQuery, values);
          }
        };

        try {
          const insertRes = await tryInsertQuery(true);
          if (insertRes && insertRes.rows.length > 0) {
            postgresUpdatedPlace = mapRowToLugar(insertRes.rows[0]);
          }
        } catch (insertErr: any) {
          if (insertErr?.code === '42703' || insertErr?.message?.includes('parroquia') || insertErr?.message?.includes('comuna') || insertErr?.message?.includes('does not exist')) {
            const insertResFallback = await tryInsertQuery(false);
            if (insertResFallback && insertResFallback.rows.length > 0) {
              postgresUpdatedPlace = mapRowToLugar(insertResFallback.rows[0]);
            }
          } else {
            console.warn('⚠️ [PostgreSQL] Error en UPSERT de nuevo lugar:', insertErr?.message || insertErr);
          }
        }
      }
    } catch (err: any) {
      console.warn('⚠️ [PostgreSQL] Error al actualizar en PostgreSQL, procediendo con persistencia local:', err?.message || err);
    }
  }

  // 2. Persistencia en archivo local y caché en memoria (siempre se ejecuta para redundancia total)
  const currentList = readLocalFile();
  let index = currentList.findIndex(p => p.id_slug === slug);
  const baseObj = current || {
    id_slug: slug,
    nombre: updates.nombre || slug,
    tipo: updates.tipo || 'Gastronomía',
    icono: updates.icono || 'restaurante.svg',
    provincia: updates.provincia || 'Santa Elena',
    ciudad: updates.ciudad || 'Santa Elena',
    zona: updates.zona || updates.comuna || 'Olón',
    latitud: updates.latitud ?? -1.82,
    longitud: updates.longitud ?? -80.75,
    es_referencia: false,
    es_servicio: false,
    prioridad: 2,
    origen: 'directorio_info',
    estado: 'activo',
  };

  const finalUpdated: Lugar = {
    ...baseObj,
    ...updates,
    ...(postgresUpdatedPlace || {}),
    id_slug: slug,
    parroquia: updates.parroquia || baseObj.parroquia,
    comuna: updates.comuna || updates.zona || baseObj.comuna || baseObj.zona,
  };

  if (index >= 0) {
    currentList[index] = finalUpdated;
  } else {
    currentList.unshift(finalUpdated);
  }

  writeLocalFile(currentList);
  invalidateUbicameCache();

  return finalUpdated;
}

/**
 * Eliminar un negocio o punto de referencia (Super Admin)
 */
export async function deleteLugar(slug: string): Promise<boolean> {
  let deletedFromPg = false;
  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
      const res = await pool.query(`DELETE FROM lugares WHERE id_slug = $1`, [slug]);
      deletedFromPg = (res.rowCount || 0) > 0;
    } catch (err) {
      console.warn('⚠️ [PostgreSQL] Error al eliminar en PostgreSQL, procediendo localmente:', err);
    }
  }

  const currentList = readLocalFile();
  const filtered = currentList.filter(p => p.id_slug !== slug);
  const deletedFromLocal = filtered.length < currentList.length;

  if (deletedFromLocal) {
    writeLocalFile(filtered);
  }
  invalidateUbicameCache();

  return deletedFromPg || deletedFromLocal || true;
}

/**
 * Crear un nuevo lugar individualmente (Super Admin)
 * Garantiza que siempre tenga latitud y longitud válidas y que nunca falle por columnas inexistentes
 */
export async function createLugar(data: Lugar): Promise<Lugar> {
  const coords = getCoordinatesForPlace(
    data.zona || data.comuna,
    data.parroquia,
    data.ciudad,
    data.provincia,
    data.latitud,
    data.longitud,
    data.id_slug
  );
  data.latitud = coords.lat;
  data.longitud = coords.lng;

  if (data.comuna && !data.zona) {
    data.zona = data.comuna;
  }

  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
      await ensurePostgresColumns(pool);

      const tryInsert = async (includeTerritorial: boolean) => {
        if (includeTerritorial) {
          const query = `
            INSERT INTO lugares (
              id_slug, nombre, tipo, icono, provincia, ciudad, zona, parroquia, comuna,
              latitud, longitud, es_referencia, es_servicio, prioridad,
              origen, whatsapp, url_perfil, estado, descripcion, foto_url
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9,
              $10, $11, $12, $13, $14,
              $15, $16, $17, $18, $19, $20
            )
            ON CONFLICT (id_slug) DO UPDATE SET
              nombre = EXCLUDED.nombre,
              tipo = EXCLUDED.tipo,
              icono = EXCLUDED.icono,
              provincia = EXCLUDED.provincia,
              ciudad = EXCLUDED.ciudad,
              zona = EXCLUDED.zona,
              parroquia = EXCLUDED.parroquia,
              comuna = EXCLUDED.comuna,
              latitud = EXCLUDED.latitud,
              longitud = EXCLUDED.longitud,
              es_referencia = EXCLUDED.es_referencia,
              es_servicio = EXCLUDED.es_servicio,
              prioridad = EXCLUDED.prioridad,
              origen = EXCLUDED.origen,
              whatsapp = EXCLUDED.whatsapp,
              url_perfil = EXCLUDED.url_perfil,
              estado = EXCLUDED.estado,
              descripcion = EXCLUDED.descripcion,
              foto_url = EXCLUDED.foto_url
            RETURNING *;
          `;
          const values = [
            data.id_slug, data.nombre, data.tipo, data.icono || 'lugar.svg',
            data.provincia, data.ciudad, data.zona,
            data.parroquia || null, data.comuna || data.zona || null,
            data.latitud, data.longitud,
            Boolean(data.es_referencia), Boolean(data.es_servicio),
            data.prioridad || 3, data.origen || 'directorio_info',
            data.whatsapp || null, data.url_perfil || null,
            data.estado || 'activo', data.descripcion || null,
            data.foto_url || null,
          ];
          return pool.query(query, values);
        } else {
          const query = `
            INSERT INTO lugares (
              id_slug, nombre, tipo, icono, provincia, ciudad, zona,
              latitud, longitud, es_referencia, es_servicio, prioridad,
              origen, whatsapp, url_perfil, estado, descripcion, foto_url
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, $12,
              $13, $14, $15, $16, $17, $18
            )
            ON CONFLICT (id_slug) DO UPDATE SET
              nombre = EXCLUDED.nombre,
              tipo = EXCLUDED.tipo,
              icono = EXCLUDED.icono,
              provincia = EXCLUDED.provincia,
              ciudad = EXCLUDED.ciudad,
              zona = EXCLUDED.zona,
              latitud = EXCLUDED.latitud,
              longitud = EXCLUDED.longitud,
              es_referencia = EXCLUDED.es_referencia,
              es_servicio = EXCLUDED.es_servicio,
              prioridad = EXCLUDED.prioridad,
              origen = EXCLUDED.origen,
              whatsapp = EXCLUDED.whatsapp,
              url_perfil = EXCLUDED.url_perfil,
              estado = EXCLUDED.estado,
              descripcion = EXCLUDED.descripcion,
              foto_url = EXCLUDED.foto_url
            RETURNING *;
          `;
          const values = [
            data.id_slug, data.nombre, data.tipo, data.icono || 'lugar.svg',
            data.provincia, data.ciudad, data.zona,
            data.latitud, data.longitud,
            Boolean(data.es_referencia), Boolean(data.es_servicio),
            data.prioridad || 3, data.origen || 'directorio_info',
            data.whatsapp || null, data.url_perfil || null,
            data.estado || 'activo', data.descripcion || null,
            data.foto_url || null,
          ];
          return pool.query(query, values);
        }
      };

      try {
        const res = await tryInsert(true);
        if (res.rows.length > 0) return mapRowToLugar(res.rows[0]);
      } catch (insertErr: any) {
        if (insertErr?.code === '42703' || insertErr?.message?.includes('parroquia') || insertErr?.message?.includes('comuna') || insertErr?.message?.includes('does not exist')) {
          const fallbackRes = await tryInsert(false);
          if (fallbackRes.rows.length > 0) return mapRowToLugar(fallbackRes.rows[0]);
        } else {
          console.warn('⚠️ [PostgreSQL] Error al crear en PostgreSQL, procediendo local:', insertErr?.message || insertErr);
        }
      }
    } catch (err) {
      console.warn('⚠️ [PostgreSQL] Error general al crear en PostgreSQL, usando guardado local:', err);
    }
  }

  const currentList = readLocalFile();
  const index = currentList.findIndex(p => p.id_slug === data.id_slug);
  if (index >= 0) {
    currentList[index] = data;
  } else {
    currentList.unshift(data);
  }
  writeLocalFile(currentList);
  return data;
}

/**
 * Conexión a PostgreSQL compartido con ubicame.cc en Producción
 */
function getPgPool() {
  return getDbPool();
}

function mapRowToLugar(row: any): Lugar {
  const latParsed = row.latitud != null ? parseFloat(row.latitud) : NaN;
  const lngParsed = row.longitud != null ? parseFloat(row.longitud) : NaN;

  let email_propietario = row.email_propietario || undefined;
  let nombre_propietario = row.nombre_propietario || undefined;

  if (!email_propietario && row.descripcion) {
    const match = row.descripcion.match(/Cuenta Google:\s*([^<]*)<([^>]+)>/i);
    if (match) {
      nombre_propietario = match[1]?.trim() || undefined;
      email_propietario = match[2]?.trim().toLowerCase() || undefined;
    } else {
      const emailOnly = row.descripcion.match(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/);
      if (emailOnly) {
        email_propietario = emailOnly[1].toLowerCase();
      }
    }
  }

  return {
    id_slug: row.id_slug,
    nombre: row.nombre,
    tipo: row.tipo,
    icono: row.icono || 'lugar.svg',
    provincia: row.provincia || 'Santa Elena',
    ciudad: row.ciudad || 'Santa Elena',
    parroquia: row.parroquia || undefined,
    comuna: row.comuna || row.zona || undefined,
    zona: row.zona || 'Olón',
    latitud: !isNaN(latParsed) ? latParsed : -1.82,
    longitud: !isNaN(lngParsed) ? lngParsed : -80.75,
    es_referencia: Boolean(row.es_referencia),
    es_servicio: Boolean(row.es_servicio),
    prioridad: parseInt(row.prioridad, 10) || 3,
    origen: row.origen || 'directorio_info',
    whatsapp: row.whatsapp || undefined,
    url_perfil: row.url_perfil || undefined,
    estado: row.estado || 'activo',
    descripcion: row.descripcion || undefined,
    foto_url: row.foto_url || undefined,
    email_propietario,
    nombre_propietario,
  };
}

async function getLugaresFromPostgres(filters?: PlaceFilters): Promise<Lugar[]> {
  const pool = await getPgPool();
  const conditions: string[] = ["estado = 'activo'"];
  const values: any[] = [];
  let idx = 1;

  if (filters?.search) {
    conditions.push(`(
      LOWER(nombre) LIKE $${idx} OR
      LOWER(tipo) LIKE $${idx} OR
      LOWER(provincia) LIKE $${idx} OR
      LOWER(ciudad) LIKE $${idx} OR
      LOWER(zona) LIKE $${idx} OR
      LOWER(descripcion) LIKE $${idx}
    )`);
    values.push(`%${filters.search.toLowerCase()}%`);
    idx++;
  }

  if (filters?.provincia) {
    conditions.push(`LOWER(provincia) = LOWER($${idx++})`);
    values.push(filters.provincia);
  }

  if (filters?.canton || filters?.ciudad) {
    conditions.push(`LOWER(ciudad) = LOWER($${idx++})`);
    values.push(filters.canton || filters.ciudad);
  }

  if (filters?.zona || filters?.comuna) {
    conditions.push(`(LOWER(zona) = LOWER($${idx}) OR LOWER(nombre) LIKE $${idx + 1})`);
    values.push((filters.zona || filters.comuna)!.toLowerCase());
    values.push(`%${(filters.zona || filters.comuna)!.toLowerCase()}%`);
    idx += 2;
  }

  if (filters?.tipo) {
    conditions.push(`LOWER(tipo) = LOWER($${idx++})`);
    values.push(filters.tipo);
  }

  if (filters?.solo_ubicame_cc) {
    conditions.push(`(prioridad = 1 OR origen = 'ubicame_cc')`);
  }

  const query = `
    SELECT id_slug, nombre, tipo, icono, provincia, ciudad, zona,
           latitud, longitud, es_referencia, es_servicio, prioridad,
           origen, whatsapp, url_perfil, estado, descripcion, foto_url
    FROM lugares
    WHERE ${conditions.join(' AND ')}
    ORDER BY prioridad ASC, es_referencia DESC, nombre ASC
  `;

  const res = await pool.query(query, values);
  return res.rows.map(mapRowToLugar);
}

/**
 * Obtener todos los lugares pertenecientes a un propietario (verificados por email de Google)
 * Incluye tanto lugares activos como pendientes de aprobación.
 */
export async function getLugaresByOwnerEmail(email: string): Promise<Lugar[]> {
  if (!email) return [];
  const cleanEmail = email.toLowerCase().trim();

  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
      const simpleQuery = `
        SELECT id_slug, nombre, tipo, icono, provincia, ciudad, zona,
               latitud, longitud, es_referencia, es_servicio, prioridad,
               origen, whatsapp, url_perfil, estado, descripcion, foto_url
        FROM lugares
        WHERE LOWER(descripcion) LIKE $1;
      `;
      const res = await pool.query(simpleQuery, [`%${cleanEmail}%`]);
      return res.rows.map(mapRowToLugar);
    } catch (err) {
      console.warn('Error al buscar lugares por dueño en Postgres:', err);
    }
  }

  const local = readLocalFile();
  return local.filter(p => {
    const owner = p.email_propietario?.toLowerCase() || '';
    const desc = p.descripcion?.toLowerCase() || '';
    return owner === cleanEmail || desc.includes(cleanEmail);
  });
}

