import { Lugar } from '@/types/lugar';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { getCoordinatesForPlace, inferProvinceAndCanton } from '@/lib/geo';

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
 * Soporta cualquier provincia y cantón del Ecuador mediante inferencia inteligente.
 */
export function parseTerritoryFromRestaurant(r: any): {
  prov: string;
  city: string;
  parish: string;
  sector: string;
} {
  const raw = r.locality || r.parish || r.neighborhood || '';
  const parts = raw.split(/[|,]/).map((s: string) => s.trim()).filter(Boolean);

  let prov = r.province;
  let city = r.city;
  let parish = r.parish && !r.parish.includes(',') && !r.parish.includes('|') ? r.parish : null;
  let sector = r.sector || r.neighborhood;

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

  // Si no se proporcionó provincia explícita, inferir desde ciudad, sector o dirección
  if (!prov) {
    const candidateStrings = [city, sector, parish, r.address, r.locality, r.neighborhood].filter(Boolean);
    for (const cand of candidateStrings) {
      const inferred = inferProvinceAndCanton(cand);
      if (inferred?.provincia) {
        prov = inferred.provincia;
        if (!city && inferred.canton) city = inferred.canton;
        break;
      }
    }
  }

  // Si aún no hay cantón/ciudad, intentar inferir del sector
  if (!city && sector) {
    const inferred = inferProvinceAndCanton(sector);
    if (inferred?.canton) city = inferred.canton;
  }

  // Fallbacks predeterminados inteligentes
  prov = prov || 'Santa Elena';
  city = city || (prov === 'Santa Elena' ? 'Santa Elena' : prov);
  parish = parish || (prov === 'Santa Elena' ? 'Manglaralto' : city);
  sector = sector || parish;

  return { prov, city, parish, sector };
}

/**
 * Mapeo inteligente de las 5 Verticales de ubicame.cc:
 * 1. MenuQR Pro (Restaurantes, Bares, Cafés, Food Trucks)
 * 2. Catálogo E-Commerce (Tiendas, Ropa, Calzado, Joyería)
 * 3. Servicios Técnicos (Técnicos, Plomeros, Electricistas, Cerrajería)
 * 4. Agenda de Citas & Turnos (Consultorios Médicos, Dentistas, Barberías, Spas)
 * 5. Hospedaje & Cabañas (Hostales, Glampings, Casas Vacacionales)
 */
export function detectVerticalDetails(r: any): {
  tipo: string;
  icono: string;
  es_servicio: boolean;
  verticalLabel: string;
} {
  const bType = (r.businessType || '').toUpperCase();
  const spec = (r.specialty || '').toLowerCase();
  const rawName = (r.name || '').trim();
  const nameLower = rawName.toLowerCase();
  const descLower = (r.description || '').toLowerCase();

  // Inspeccionar customLabels JSON si está presente
  let customVertical = '';
  let customSubType = '';
  if (r.customLabels) {
    try {
      const parsed = typeof r.customLabels === 'string' ? JSON.parse(r.customLabels) : r.customLabels;
      customVertical = (parsed.vertical || '').toLowerCase();
      customSubType = (parsed.businessSubType || '').toUpperCase();
    } catch (e) {}
  }

  // 1. Hospedaje & Cabañas (reservas.ubicame.cc)
  if (
    customVertical === 'reservas' ||
    customSubType === 'RESERVAS' ||
    nameLower.includes('hostal') ||
    nameLower.includes('hotel') ||
    nameLower.includes('lodge') ||
    nameLower.includes('cabaña') ||
    nameLower.includes('cabana') ||
    nameLower.includes('glamping') ||
    descLower.includes('hospedaje') ||
    descLower.includes('habitacion')
  ) {
    return {
      tipo: 'Hospedaje & Cabañas',
      icono: 'hotel.svg',
      es_servicio: false,
      verticalLabel: 'Hospedaje & Cabañas (reservas.ubicame.cc)',
    };
  }

  // 2. Agenda de Citas & Turnos (citas.ubicame.cc)
  if (
    customVertical === 'citas' ||
    customSubType === 'CITAS' ||
    nameLower.includes('clinica') ||
    nameLower.includes('clínica') ||
    nameLower.includes('dentista') ||
    nameLower.includes('odont') ||
    nameLower.includes('medico') ||
    nameLower.includes('médico') ||
    nameLower.includes('doctor') ||
    nameLower.includes('barber') ||
    nameLower.includes('spa') ||
    nameLower.includes('estetica') ||
    nameLower.includes('estética') ||
    spec.includes('salud') ||
    descLower.includes('citas')
  ) {
    return {
      tipo: 'Citas & Salud / Belleza',
      icono: 'salud.svg',
      es_servicio: true,
      verticalLabel: 'Agenda de Citas & Turnos (citas.ubicame.cc)',
    };
  }

  // 3. Servicios Técnicos (servicios.ubicame.cc)
  if (
    customVertical === 'servicios' ||
    customSubType === 'SERVICIOS' ||
    nameLower.includes('plomer') ||
    nameLower.includes('electric') ||
    nameLower.includes('cerraj') ||
    nameLower.includes('tecnico') ||
    nameLower.includes('técnico') ||
    nameLower.includes('reparac') ||
    nameLower.includes('mantenimiento') ||
    (bType === 'SERVICES' && !nameLower.includes('hostal'))
  ) {
    return {
      tipo: 'Servicios Técnicos',
      icono: 'servicio.svg',
      es_servicio: true,
      verticalLabel: 'Servicios Técnicos (servicios.ubicame.cc)',
    };
  }

  // 4. Catálogo E-Commerce (catalogo.ubicame.cc)
  if (
    bType === 'RETAIL' ||
    customVertical === 'catalogo' ||
    customVertical === 'ctalo' ||
    customSubType === 'RETAIL' ||
    nameLower.includes('liquor') ||
    nameLower.includes('licor') ||
    nameLower.includes('boutique') ||
    nameLower.includes('tienda') ||
    nameLower.includes('ropa') ||
    nameLower.includes('zapater') ||
    nameLower.includes('joyer') ||
    spec.includes('licores') ||
    spec.includes('artículos')
  ) {
    return {
      tipo: 'Comercio & Catálogo',
      icono: nameLower.includes('liquor') || spec.includes('licor') ? 'bar.svg' : 'supermercado.svg',
      es_servicio: false,
      verticalLabel: 'Catálogo E-Commerce (catalogo.ubicame.cc)',
    };
  }

  // 5. MenuQR Pro (menuqr.ubicame.cc) - Predeterminado gastronómico
  return {
    tipo: 'Gastronomía',
    icono: spec.includes('café') || spec.includes('cafe') || nameLower.includes('cafeteria') ? 'cafeteria.svg' : 'restaurante.svg',
    es_servicio: false,
    verticalLabel: 'MenuQR Pro (menuqr.ubicame.cc)',
  };
}

/**
 * Transforma un registro de la tabla Restaurant de ubicame.cc a la estructura oficial Lugar
 * GARANTIZANDO que siempre tenga latitud y longitud válidas
 */
export function mapRestaurantToLugar(r: any): Lugar {
  const { prov, city, parish, sector } = parseTerritoryFromRestaurant(r);
  const { tipo, icono, es_servicio } = detectVerticalDetails(r);

  const rawName = (r.name || '').trim();
  let formattedName = rawName.replace(/\s+/g, ' ');
  if (formattedName.toLowerCase() === 'sonrisas del mar') formattedName = 'Sonrisas del Mar';
  if (formattedName.toLowerCase() === 'hostal roses') formattedName = 'Hostal Roses';
  if (formattedName.toLowerCase() === 'clinica santa lucia') formattedName = 'Clínica Santa Lucía';
  if (formattedName.toLowerCase() === 'sumeria liquors' || formattedName.toLowerCase() === 'sumeria  liquors') {
    formattedName = 'Sumeria Liquors';
  }

  // OBLIGATORIO: Resolver y garantizar latitud y longitud válidas para TODOS los negocios
  const coords = getCoordinatesForPlace(
    sector,
    parish,
    city,
    prov,
    r.latitude,
    r.longitude,
    r.slug
  );

  const phone = (r.whatsapp || r.contactNumbers || '').replace(/[^0-9]/g, '');

  let desc = r.description;
  if (!desc) {
    if (formattedName === 'Clínica Santa Lucía') {
      desc = 'Atención médica general y servicios de salud para residentes y visitantes en Montañita y la Ruta del Spondylus. Agenda de citas y consultas.';
    } else if (formattedName === 'Hostal Roses') {
      desc = 'Hospedaje acogedor y confortable en Montañita con WiFi de alta velocidad, parqueadero gratuito, piscina y pet friendly. Reservas directas.';
    } else if (formattedName === 'Sonrisas del Mar') {
      desc = 'Servicios profesionales y atención personalizada en la comuna de Montañita, Santa Elena.';
    } else if (formattedName === 'Msd') {
      desc = 'Tienda y comercio en Manglaralto. Catálogo digital de artículos y atención directa.';
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
    latitud: coords.lat,
    longitud: coords.lng,
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
 * Consulta la base de datos de ubicame.cc para obtener todos los negocios registrados.
 * Si detecta que un negocio no tiene latitud o longitud en PostgreSQL, la calcula
 * y actualiza automáticamente la base de datos para que quede georreferenciado permanentemente.
 */
export async function fetchUbicameCcBusinesses(): Promise<Lugar[]> {
  const connectionString = getUbicameCcDbUrl();
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 3500,
  });

  try {
    const res = await pool.query('SELECT * FROM "Restaurant" WHERE "isSuspended" = false ORDER BY "createdAt" DESC');
    const lugares: Lugar[] = [];

    const updatePromises: Promise<any>[] = [];

    for (const r of res.rows) {
      const lugar = mapRestaurantToLugar(r);
      lugares.push(lugar);

      // Si el registro original en PostgreSQL carecía de coordenadas, actualizar la base de datos de inmediato
      const hasMissingDbCoords =
        r.latitude == null ||
        r.longitude == null ||
        isNaN(parseFloat(r.latitude)) ||
        parseFloat(r.latitude) === 0 ||
        isNaN(parseFloat(r.longitude)) ||
        parseFloat(r.longitude) === 0;

      if (hasMissingDbCoords && r.id) {
        updatePromises.push(
          pool.query(
            'UPDATE "Restaurant" SET latitude = $1, longitude = $2 WHERE id = $3',
            [lugar.latitud, lugar.longitud, r.id]
          ).catch((e: any) => {
            console.warn(`[ubicameSync] No se pudo guardar lat/lng para ${r.slug}:`, e.message);
          })
        );
      }
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    // Auto-sincronizar en segundo plano con el archivo JSON local
    if (lugares.length > 0) {
      persistLugaresToJsonAsync(lugares);
    }

    return lugares;
  } catch (err: any) {
    console.warn('⚠️ [ubicameSync] No se pudo consultar "Restaurant" en ubicame.cc:', err.message);
    return [];
  } finally {
    await pool.end().catch(() => {});
  }
}

/**
 * Persiste los negocios en el archivo JSON local de forma no bloqueante
 */
function persistLugaresToJsonAsync(newUbicameLugares: Lugar[]) {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'lugares.json');
    if (!fs.existsSync(filePath)) return;

    const currentLugares: Lugar[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let hasChanges = false;

    for (const u of newUbicameLugares) {
      const idx = currentLugares.findIndex(l => l.id_slug === u.id_slug);
      if (idx >= 0) {
        currentLugares[idx] = { ...currentLugares[idx], ...u };
        hasChanges = true;
      } else {
        currentLugares.unshift(u);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      currentLugares.sort((a, b) => {
        if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
        return a.nombre.localeCompare(b.nombre, 'es');
      });
      fs.writeFileSync(filePath, JSON.stringify(currentLugares, null, 2), 'utf-8');
    }
  } catch (e) {
    // Continuar sin interrumpir el flujo
  }
}

/**
 * Sincroniza los negocios de ubicame.cc tanto en el archivo JSON local como en PostgreSQL
 */
export async function syncUbicameCcWithDirectory(): Promise<{
  success: boolean;
  syncedCount: number;
  totalLugares: number;
  businesses: { nombre: string; vertical: string; lat: number; lng: number }[];
}> {
  const businesses = await fetchUbicameCcBusinesses();

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
    businesses: businesses.map(b => ({
      nombre: b.nombre,
      vertical: b.tipo,
      lat: b.latitud,
      lng: b.longitud,
    })),
  };
}
