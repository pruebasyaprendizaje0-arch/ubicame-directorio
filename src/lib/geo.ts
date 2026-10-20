/**
 * Utilidades de Geolocalización, cálculo de distancias (Haversine)
 * y catálogo territorial jerárquico de Ecuador:
 * 1. Provincia
 * 2. Cantón
 * 3. Parroquia
 * 4. Comuna o Localidad
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas usando la fórmula de Haversine
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Formatea una distancia en kilómetros de manera amigable para el usuario
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return 'a menos de 100 m';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `a ${meters} m`;
  }
  return `a ${distanceKm.toFixed(1)} km`;
}

/**
 * Estructura jerárquica territorial oficial de Ecuador (enfocada en la Costa y Península)
 */
export const DIVISION_TERRITORIAL_ECUADOR: Record<
  string, // Provincia
  Record<
    string, // Cantón
    Record<
      string, // Parroquia
      string[] // Comunas o Localidades
    >
  >
> = {
  'Santa Elena': {
    'Santa Elena': {
      'Manglaralto': [
        'Olón',
        'Montañita',
        'Manglaralto',
        'Cadeate',
        'Curía',
        'San José',
        'Las Núñez',
        'La Entrada',
        'San Antonio',
        'Libertador Bolívar',
        'Valdivia',
        'San Pedro',
        'Ayangue',
        'Río Chico',
        'Dos Mangas',
        'Sinchal',
        'Barcelona',
        'Pajiza',
      ],
      'Colonche': [
        'Colonche',
        'Palmar',
        'Manantial de Colonche',
        'Bambil Collao',
        'Bambil Deshecho',
        'Febres Cordero',
        'Juntas del Pacífico',
        'Monteverde',
      ],
      'Chanduy': [
        'Chanduy',
        'Puerto de Chanduy',
        'Pechiche',
        'Tugaduaja',
        'Engunga',
        'Manantial de Chanduy',
        'El Real',
      ],
      'Santa Elena (Urbana)': [
        'Ballenita',
        'Punta Blanca',
        'Capes',
        'San Pablo',
        'Santa Elena Centro',
      ],
      'San José de Ancón': [
        'Ancón',
        'El Tambo',
      ],
      'Atahualpa': [
        'Atahualpa',
      ],
    },
    'Salinas': {
      'Salinas': [
        'Chipipe',
        'San Lorenzo',
        'Mar Bravo',
      ],
      'José Luis Tamayo': [
        'Muey',
        'Punta Carnero',
      ],
      'Anconcito': [
        'Anconcito',
      ],
    },
    'La Libertad': {
      'La Libertad': [
        'La Libertad Centro',
        'General Enríquez Gallo',
      ],
    },
  },
  'Guayas': {
    'Guayaquil': {
      'Tarqui': ['Urdesa', 'Kennedy', 'Alborada'],
      'Ximena': ['Centenario', 'Pradera'],
    },
    'Playas': {
      'General Villamil': ['Playa Rosada', 'Engabao', 'Puerto Engabao'],
    },
  },
  'Manabí': {
    'Puerto López': {
      'Puerto López': ['Salango', 'Machalilla', 'Ayampe', 'Las Tunas', 'Puerto Rico'],
    },
    'Manta': {
      'Manta': ['Tarqui', 'Los Esteros', 'San Mateo', 'Santa Marianita'],
    },
  },
};

/**
 * Catálogos planos iniciales
 */
export const PROVINCIAS_ECUADOR = Object.keys(DIVISION_TERRITORIAL_ECUADOR);

export const CANTONES_SANTA_ELENA = Object.keys(DIVISION_TERRITORIAL_ECUADOR['Santa Elena']);

export const PARROQUIAS_SANTA_ELENA = Object.keys(DIVISION_TERRITORIAL_ECUADOR['Santa Elena']['Santa Elena']);

export const COMUNAS_LOCALIDADES_SANTA_ELENA = Object.values(
  DIVISION_TERRITORIAL_ECUADOR['Santa Elena']['Santa Elena']
).flat();

/**
 * Obtener lista de cantones según la provincia seleccionada
 */
export function getCantonesPorProvincia(provincia?: string): string[] {
  if (!provincia || !DIVISION_TERRITORIAL_ECUADOR[provincia]) {
    // Si no hay provincia, devolver todos los cantones registrados
    const set = new Set<string>();
    Object.values(DIVISION_TERRITORIAL_ECUADOR).forEach(cantones => {
      Object.keys(cantones).forEach(c => set.add(c));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }
  return Object.keys(DIVISION_TERRITORIAL_ECUADOR[provincia]).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtener lista de parroquias según cantón seleccionado
 */
export function getParroquiasPorCanton(provincia?: string, canton?: string): string[] {
  const set = new Set<string>();

  for (const [prov, cantones] of Object.entries(DIVISION_TERRITORIAL_ECUADOR)) {
    if (provincia && prov !== provincia) continue;
    for (const [cant, parroquias] of Object.entries(cantones)) {
      if (canton && cant !== canton) continue;
      Object.keys(parroquias).forEach(p => set.add(p));
    }
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtener lista de comunas / localidades según filtros jerárquicos
 */
export function getComunasPorFiltros(provincia?: string, canton?: string, parroquia?: string): string[] {
  const set = new Set<string>();

  for (const [prov, cantones] of Object.entries(DIVISION_TERRITORIAL_ECUADOR)) {
    if (provincia && prov !== provincia) continue;
    for (const [cant, parroquias] of Object.entries(cantones)) {
      if (canton && cant !== canton) continue;
      for (const [parr, comunas] of Object.entries(parroquias)) {
        if (parroquia && parr !== parroquia) continue;
        comunas.forEach(c => set.add(c));
      }
    }
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Infiere de forma inteligente la jerarquía territorial a partir del nombre, zona o descripción
 */
export function inferHierarchy(text: string): {
  provincia?: string;
  canton?: string;
  parroquia?: string;
  comuna?: string;
} {
  if (!text) return {};
  const lower = text.toLowerCase();

  for (const [prov, cantones] of Object.entries(DIVISION_TERRITORIAL_ECUADOR)) {
    for (const [cant, parroquias] of Object.entries(cantones)) {
      for (const [parr, comunas] of Object.entries(parroquias)) {
        for (const comuna of comunas) {
          const cLower = comuna.toLowerCase();
          const regex = new RegExp(`\\b${cLower}\\b`, 'i');
          if (regex.test(lower)) {
            return {
              provincia: prov,
              canton: cant,
              parroquia: parr,
              comuna: comuna,
            };
          }
        }
        if (new RegExp(`\\b${parr.toLowerCase()}\\b`, 'i').test(lower)) {
          return { provincia: prov, canton: cant, parroquia: parr };
        }
      }
      if (new RegExp(`\\b${cant.toLowerCase()}\\b`, 'i').test(lower)) {
        return { provincia: prov, canton: cant };
      }
    }
  }

  return {};
}
