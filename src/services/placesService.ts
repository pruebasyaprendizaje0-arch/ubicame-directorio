import { Lugar, PlaceFilters } from '@/types/lugar';
import localLugares from '@/data/lugares.json';
import { getDbPool } from '@/lib/db';
import {
  calculateDistanceKm,
  PROVINCIAS_ECUADOR,
  COMUNAS_LOCALIDADES_SANTA_ELENA,
  PARROQUIAS_SANTA_ELENA,
  CANTONES_SANTA_ELENA,
} from '@/lib/geo';
import fs from 'fs';
import path from 'path';

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

  // Filtrado en memoria (aplica siempre para fallback o refinamiento)
  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      p =>
        p.nombre.toLowerCase().includes(q) ||
        p.tipo.toLowerCase().includes(q) ||
        (p.provincia && p.provincia.toLowerCase().includes(q)) ||
        (p.ciudad && p.ciudad.toLowerCase().includes(q)) ||
        (p.zona && p.zona.toLowerCase().includes(q)) ||
        (p.parroquia && p.parroquia.toLowerCase().includes(q)) ||
        (p.comuna && p.comuna.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
  }

  if (filters?.provincia) {
    const prov = filters.provincia.toLowerCase();
    results = results.filter(p => (p.provincia || '').toLowerCase() === prov);
  }

  if (filters?.canton || filters?.ciudad) {
    const cant = (filters.canton || filters.ciudad)!.toLowerCase();
    results = results.filter(p => (p.ciudad || '').toLowerCase() === cant);
  }

  if (filters?.parroquia) {
    const parr = filters.parroquia.toLowerCase();
    results = results.filter(
      p =>
        (p.parroquia && p.parroquia.toLowerCase() === parr) ||
        (p.zona && p.zona.toLowerCase() === parr)
    );
  }

  if (filters?.comuna || filters?.zona) {
    const com = (filters.comuna || filters.zona)!.toLowerCase();
    results = results.filter(
      p =>
        (p.zona && p.zona.toLowerCase() === com) ||
        (p.comuna && p.comuna.toLowerCase() === com) ||
        p.nombre.toLowerCase().includes(com)
    );
  }

  if (filters?.tipo) {
    results = results.filter(p => p.tipo.toLowerCase() === filters.tipo!.toLowerCase());
  }

  if (filters?.solo_ubicame_cc) {
    results = results.filter(p => p.prioridad === 1 || p.origen === 'ubicame_cc');
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
      return res.rows.map(mapRowToLugar);
    } catch (err) {
      console.warn('Error al consultar lugares admin en Postgres, usando fallback local:', err);
    }
  }

  return sortLugares(readLocalFile());
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
  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
      const res = await pool.query(
        `SELECT * FROM lugares WHERE id_slug = $1 LIMIT 1`,
        [slug]
      );
      if (res.rows.length > 0) return mapRowToLugar(res.rows[0]);
    } catch (err) {
      console.warn('Error en getLugarBySlug Postgres, usando local:', err);
    }
  }

  const lugares = readLocalFile();
  return lugares.find(p => p.id_slug === slug) || null;
}

/**
 * Actualizar un negocio o punto de referencia existente (Super Admin)
 */
export async function updateLugar(slug: string, updates: Partial<Lugar>): Promise<Lugar | null> {
  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      const allowedFields = [
        'nombre', 'tipo', 'icono', 'provincia', 'ciudad', 'zona',
        'latitud', 'longitud', 'es_referencia', 'es_servicio', 'prioridad',
        'origen', 'whatsapp', 'url_perfil', 'estado', 'descripcion', 'foto_url'
      ];

      for (const key of allowedFields) {
        if ((updates as any)[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          values.push((updates as any)[key]);
        }
      }

      if (fields.length > 0) {
        values.push(slug);
        const query = `
          UPDATE lugares
          SET ${fields.join(', ')}
          WHERE id_slug = $${idx}
          RETURNING *;
        `;
        const res = await pool.query(query, values);
        if (res.rows.length > 0) return mapRowToLugar(res.rows[0]);
      }
    } catch (err) {
      console.error('Error al actualizar en PostgreSQL:', err);
      throw err;
    }
  }

  // Actualización local
  const currentList = readLocalFile();
  const index = currentList.findIndex(p => p.id_slug === slug);
  if (index === -1) return null;

  const updated: Lugar = {
    ...currentList[index],
    ...updates,
    id_slug: slug,
  };

  currentList[index] = updated;
  writeLocalFile(currentList);
  return updated;
}

/**
 * Eliminar un negocio o punto de referencia (Super Admin)
 */
export async function deleteLugar(slug: string): Promise<boolean> {
  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
      const res = await pool.query(`DELETE FROM lugares WHERE id_slug = $1`, [slug]);
      return (res.rowCount || 0) > 0;
    } catch (err) {
      console.error('Error al eliminar en PostgreSQL:', err);
      throw err;
    }
  }

  const currentList = readLocalFile();
  const filtered = currentList.filter(p => p.id_slug !== slug);
  if (filtered.length === currentList.length) return false;

  writeLocalFile(filtered);
  return true;
}

/**
 * Crear un nuevo lugar individualmente (Super Admin)
 */
export async function createLugar(data: Lugar): Promise<Lugar> {
  if (shouldUsePostgres) {
    try {
      const pool = await getPgPool();
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
      const res = await pool.query(query, values);
      return mapRowToLugar(res.rows[0]);
    } catch (err) {
      console.error('Error al crear en PostgreSQL:', err);
      throw err;
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

  return {
    id_slug: row.id_slug,
    nombre: row.nombre,
    tipo: row.tipo,
    icono: row.icono || 'lugar.svg',
    provincia: row.provincia || 'Santa Elena',
    ciudad: row.ciudad || 'Santa Elena',
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
