import { Lugar } from '@/types/lugar';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

/**
 * Cadena de conexión para la base de datos de ubicame.cc
 */
function getUbicameCcDbUrl(): string {
  return (
    process.env.UBICAME_CC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/menuqr_pro'
  );
}

/**
 * Desglosa y estandariza la jerarquía territorial de 4 niveles:
 * Provincia -> Cantón -> Parroquia -> Comuna o Localidad
 */
export function parseTerritoryFromRestaurant(r: any): {
  prov: string;
  city: string;
  parish: string;
  sector: string;
} {
  const raw = r.locality || r.parish || '';
  const parts = raw.split(/[|,]/).map((s: string) => s.trim()).filter(Boolean);

  let prov = r.province;
  let city = r.city;
  let parish = r.parish && !r.parish.includes(',') && !r.parish.includes('|') ? r.parish : null;
  let sector = r.sector;

  if (parts.length >= 4) {
    prov = prov || parts[0];
    city = city || parts[1];
    parish = parish || parts[2];
    sector = sector || parts[3];
  } else if (parts.length === 3) {
    prov = prov || parts[0];
    city = city || parts[1];
    parish = parish || parts[2];
    sector = sector || parts[2];
  } else if (parts.length === 2) {
    prov = prov || parts[0];
    city = city || parts[1];
    parish = parish || parts[1];
    sector = sector || parts[1];
  }

  // Fallbacks predeterminados para la Península de Santa Elena y Ecuador
  prov = prov || 'Santa Elena';
  city = city || 'Santa Elena';
  parish = parish || 'Manglaralto';
  sector = sector || parish;

  return { prov, city, parish, sector };
}

/**
 * Transforma un registro de la tabla Restaurant de ubicame.cc a la estructura oficial Lugar
 */
export function mapRestaurantToLugar(r: any): Lugar {
  const { prov, city, parish, sector } = parseTerritoryFromRestaurant(r);

  const bType = (r.businessType || '').toUpperCase();
  const spec = (r.specialty || '').toLowerCase();
  const rawName = (r.name || '').trim();
  const nameLower = rawName.toLowerCase();

  let formattedName = rawName.replace(/\s+/g, ' ');
  if (formattedName.toLowerCase() === 'sonrisas del mar') formattedName = 'Sonrisas del Mar';
  if (formattedName.toLowerCase() === 'hostal roses') formattedName = 'Hostal Roses';
  if (formattedName.toLowerCase() === 'clinica santa lucia') formattedName = 'Clínica Santa Lucía';
  if (formattedName.toLowerCase() === 'sumeria liquors' || formattedName.toLowerCase() === 'sumeria  liquors') {
    formattedName = 'Sumeria Liquors';
  }

  // Categorización e íconos temáticos
  let tipo = 'Gastronomía';
  let icono = 'restaurante.svg';
  let es_servicio = false;

  if (
    bType === 'RESTAURANT' ||
    spec.includes('empanada') ||
    spec.includes('pizza') ||
    spec.includes('comida') ||
    spec.includes('restaurant')
  ) {
    tipo = 'Gastronomía';
    icono = 'restaurante.svg';
  } else if (nameLower.includes('liquor') || spec.includes('licor') || spec.includes('cerveza')) {
    tipo = 'Comercio & Licores';
    icono = 'bar.svg';
  } else if (
    nameLower.includes('hotel') ||
    nameLower.includes('hostal') ||
    nameLower.includes('lodge') ||
    bType === 'RESERVAS'
  ) {
    tipo = 'Alojamiento';
    icono = 'hotel.svg';
  } else if (
    nameLower.includes('clinica') ||
    nameLower.includes('salud') ||
    nameLower.includes('farmacia') ||
    nameLower.includes('doctor')
  ) {
    tipo = 'Salud & Farmacia';
    icono = 'hospital.svg';
    es_servicio = true;
  } else if (bType === 'RETAIL' || nameLower.includes('tienda')) {
    tipo = 'Comercio';
    icono = 'tienda.svg';
  } else {
    tipo = 'Servicios';
    icono = 'lugar.svg';
    es_servicio = true;
  }

  // Coordenadas georreferenciadas con fallbacks de precisión local
  let lat = r.latitude != null ? parseFloat(r.latitude) : null;
  let lng = r.longitude != null ? parseFloat(r.longitude) : null;

  if (lat == null || isNaN(lat)) {
    if (sector.toLowerCase() === 'montañita') {
      lat = -1.8267;
      lng = -80.7533;
    } else if (sector.toLowerCase() === 'olón' || sector.toLowerCase() === 'olon') {
      lat = -1.7983;
      lng = -80.7542;
    } else if (sector.toLowerCase() === 'manglaralto') {
      lat = -1.85;
      lng = -80.744;
    } else if (city.toLowerCase() === 'manta') {
      lat = -0.9548;
      lng = -80.7482;
    } else {
      lat = -1.8267;
      lng = -80.7533;
    }
  }

  const phone = (r.whatsapp || r.contactNumbers || '').replace(/[^0-9]/g, '');

  let desc = r.description;
  if (!desc) {
    if (formattedName === 'Clínica Santa Lucía') {
      desc = 'Atención médica y servicios de salud para residentes y visitantes en Montañita y la Ruta del Spondylus.';
    } else if (formattedName === 'Hostal Roses') {
      desc = 'Hospedaje acogedor y confortable en Montañita con WiFi de alta velocidad, parqueadero gratuito, piscina y pet friendly.';
    } else if (formattedName === 'Sonrisas del Mar') {
      desc = 'Servicios profesionales y atención personalizada en la comuna de Montañita, Santa Elena.';
    } else if (formattedName === 'Msd') {
      desc = 'Tienda y comercio en Manglaralto. Artículos de conveniencia y atención directa.';
    } else {
      desc = `${formattedName} en ${sector}, ${prov}. Menú digital y catálogo oficial en ubicame.cc.`;
    }
  }

  return {
    id_slug: r.slug,
    nombre: formattedName,
    tipo,
    icono,
    provincia: prov,
    ciudad: city,
    parroquia: parish,
    zona: sector,
    comuna: sector,
    latitud: lat,
    longitud: lng,
    es_referencia: false,
    es_servicio,
    prioridad: 1, // ★ Máxima prioridad por ser cliente de ubicame.cc
    origen: 'ubicame_cc',
    whatsapp: phone
      ? phone.startsWith('593')
        ? phone
        : phone.startsWith('0')
        ? '593' + phone.substring(1)
        : '593' + phone
      : undefined,
    url_perfil: `https://ubicame.cc/${r.slug}`,
    estado: r.isSuspended ? 'pendiente' : 'activo',
    descripcion: desc,
    foto_url: r.logoUrl || r.coverUrl || undefined,
  };
}

/**
 * Consulta la base de datos de ubicame.cc para obtener todos los negocios registrados
 */
export async function fetchUbicameCcBusinesses(): Promise<Lugar[]> {
  const connectionString = getUbicameCcDbUrl();
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 4000,
  });

  try {
    const res = await pool.query('SELECT * FROM "Restaurant" WHERE "isSuspended" = false');
    return res.rows.map(mapRestaurantToLugar);
  } catch (err: any) {
    console.warn('⚠️ [ubicameSync] No se pudo consultar "Restaurant" en ubicame.cc:', err.message);
    return [];
  } finally {
    await pool.end().catch(() => {});
  }
}

/**
 * Sincroniza los negocios de ubicame.cc tanto en el archivo JSON local como en PostgreSQL
 */
export async function syncUbicameCcWithDirectory(): Promise<{
  success: boolean;
  syncedCount: number;
  totalLugares: number;
  businesses: string[];
}> {
  const businesses = await fetchUbicameCcBusinesses();

  // Si no pudo conectar con la BD en vivo, usamos los ya guardados en src/data/lugares.json
  const filePath = path.join(process.cwd(), 'src', 'data', 'lugares.json');
  let currentLugares: Lugar[] = [];

  try {
    if (fs.existsSync(filePath)) {
      currentLugares = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error('Error leyendo lugares.json:', e);
  }

  if (businesses.length > 0) {
    for (const b of businesses) {
      const idx = currentLugares.findIndex(l => l.id_slug === b.id_slug);
      if (idx >= 0) {
        currentLugares[idx] = { ...currentLugares[idx], ...b };
      } else {
        currentLugares.unshift(b);
      }
    }

    // Ordenar con P1 primero
    currentLugares.sort((a, b) => {
      if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
      return a.nombre.localeCompare(b.nombre, 'es');
    });

    try {
      fs.writeFileSync(filePath, JSON.stringify(currentLugares, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error guardando en lugares.json:', e);
    }
  }

  return {
    success: true,
    syncedCount: businesses.length,
    totalLugares: currentLugares.length,
    businesses: businesses.map(b => b.nombre),
  };
}
