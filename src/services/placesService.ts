import { Lugar, PlaceFilters } from '@/types/lugar';
import localLugares from '@/data/lugares.json';
import { getDbPool } from '@/lib/db';
import fs from 'fs';
import path from 'path';

/**
 * Función de ordenamiento requerida por las reglas de negocio:
 * 1. prioridad ASC (1 = Cliente ubicame.cc arriba)
 * 2. es_referencia DESC (Puntos de referencia antes que regulares del mismo rango)
 * 3. nombre ASC (Alfabético)
 */
export function sortLugares(list: Lugar[]): Lugar[] {
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
 * Obtener todos los lugares activos aplicando filtros opcionales
 */
export async function getLugares(filters?: PlaceFilters): Promise<Lugar[]> {
  if (shouldUsePostgres) {
    try {
      return await getLugaresFromPostgres(filters);
    } catch (err) {
      console.warn('⚠️ [placesService] Error conectando a PostgreSQL, usando fallback local:', err);
    }
  }

  let results: Lugar[] = readLocalFile().filter(p => p.estado === 'activo');

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      p =>
        p.nombre.toLowerCase().includes(q) ||
        p.tipo.toLowerCase().includes(q) ||
        p.zona.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
  }

  if (filters?.zona) {
    results = results.filter(p => p.zona.toLowerCase() === filters.zona!.toLowerCase());
  }

  if (filters?.tipo) {
    results = results.filter(p => p.tipo.toLowerCase() === filters.tipo!.toLowerCase());
  }

  if (filters?.solo_ubicame_cc) {
    results = results.filter(p => p.prioridad === 1 || p.origen === 'ubicame_cc');
  }

  return sortLugares(results);
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
 * Obtener listado único de zonas (Olón, Montañita, Manglaralto, Cadeate, etc.)
 */
export async function getZonas(): Promise<string[]> {
  const lugares = await getLugares();
  const set = new Set(lugares.map(p => p.zona));
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
    id_slug: slug, // El id_slug se conserva
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
      LOWER(zona) LIKE $${idx} OR
      LOWER(descripcion) LIKE $${idx}
    )`);
    values.push(`%${filters.search.toLowerCase()}%`);
    idx++;
  }

  if (filters?.zona) {
    conditions.push(`LOWER(zona) = LOWER($${idx++})`);
    values.push(filters.zona);
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
