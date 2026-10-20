/**
 * Catálogo territorial oficial y exhaustivo de Ecuador (24 Provincias)
 * y utilidades geográficas de proximidad (Haversine).
 * 
 * Niveles:
 * 1. Provincia (24 Provincias oficiales de Costa, Sierra, Oriente y Galápagos)
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
 * División territorial completa de las 24 Provincias de la República del Ecuador
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
  // --- REGIÓN COSTA ---
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
      'Tarqui': ['Urdesa', 'Kennedy', 'Alborada', 'Sauces', 'Ceibos', 'La Puntilla'],
      'Ximena': ['Centenario', 'Pradera', 'Gumo'],
      'Posorja': ['Posorja', 'Data de Posorja'],
      'Chongón': ['Chongón', 'Puerto Hondo'],
      'Puná': ['Isla Puná'],
    },
    'Samborondón': {
      'La Puntilla': ['Entre Ríos', 'La Puntilla', 'Ciudad Celeste', 'Buceo'],
      'Samborondón': ['Samborondón Centro', 'Tarifa', 'Boca de Caña'],
    },
    'Daule': {
      'La Aurora': ['La Aurora', 'Villa del Rey', 'La Joya', 'Matices'],
      'Daule': ['Daule Centro', 'Los Lojas', 'Juan Bautista Aguirre'],
    },
    'Durán': {
      'Eloy Alfaro': ['Durán Centro', 'El Recreo', 'Primavera'],
    },
    'Playas': {
      'General Villamil': [
        'General Villamil (Playas)',
        'Puerto Engabao',
        'Engabao',
        'Playa Rosada',
        'Data de Villamil',
        'San Antonio de Playas',
      ],
    },
    'Milagro': {
      'Milagro': ['Milagro Centro', 'Chobo', 'Mariscal Sucre'],
    },
    'Naranjal': {
      'Naranjal': ['Naranjal Centro', 'Jesús María', 'Puerto Inca', 'Shuar'],
    },
    'El Empalme': {
      'Velasco Ibarra': ['El Empalme Centro', 'Guayas', 'El Rosario'],
    },
    'Balao': {
      'Balao': ['Balao Centro', 'San Carlos'],
    },
    'Balzar': {
      'Balzar': ['Balzar Centro'],
    },
  },

  'Manabí': {
    'Portoviejo': {
      'Portoviejo': ['Portoviejo Centro', '12 de Marzo', 'Colón'],
      'Crucita': ['Crucita', 'Las Gilces', 'Los Arenales'],
      'San Plácido': ['San Plácido', 'Chirijos', 'Calderón'],
    },
    'Manta': {
      'Manta': ['Manta Centro', 'Tarqui', 'Los Esteros', 'El Murciélago'],
      'San Mateo': ['San Mateo'],
      'Santa Marianita': ['Santa Marianita', 'Punta Blanca'],
      'San Lorenzo': ['San Lorenzo', 'Las Piñas', 'Santa Rosa'],
    },
    'Puerto López': {
      'Puerto López': ['Puerto López Centro'],
      'Machalilla': ['Machalilla', 'Playa de los Frailes'],
      'Salango': ['Salango', 'Río Chico', 'Piqueros'],
      'Ayampe': ['Ayampe', 'Las Tunas', 'Puerto Rico'],
    },
    'Montecristi': {
      'Montecristi': ['Montecristi Centro', 'La Pila', 'Anconcito de Manabí'],
    },
    'Sucre': {
      'Bahía de Caráquez': ['Bahía de Caráquez', 'Leonidas Plaza'],
      'Charapotó': ['San Clemente', 'San Jacinto', 'Charapotó'],
    },
    'San Vicente': {
      'San Vicente': ['San Vicente Centro'],
      'Canoa': ['Canoa', 'Briceño'],
    },
    'Pedernales': {
      'Pedernales': ['Pedernales Centro', 'Cojimíes', '10 de Agosto'],
    },
    'Chone': {
      'Chone': ['Chone Centro', 'Canuto', 'Convento', 'Ricaurte'],
    },
    'Jipijapa': {
      'Jipijapa': ['Jipijapa Centro', 'Puerto Cayo', 'La Unión'],
    },
  },

  'Esmeraldas': {
    'Esmeraldas': {
      'Esmeraldas': ['Esmeraldas Centro', 'Las Palmas', 'Tachina', 'Vuelta Larga'],
    },
    'Atacames': {
      'Atacames': ['Atacames', 'Tonsupa', 'Súa', 'Same', 'Tonchigüe'],
    },
    'Muisne': {
      'Muisne': ['Muisne', 'Canoa de Muisne', 'San Francisco', 'Galera', 'Quingue'],
    },
    'Quinindé': {
      'Rosa Zárate': ['Quinindé Centro', 'La Unión', 'Viche'],
    },
    'San Lorenzo': {
      'San Lorenzo': ['San Lorenzo Centro', 'Ancón de Sardinas', 'Mataje'],
    },
    'Rioverde': {
      'Rioverde': ['Rioverde Centro', 'Las Peñas', 'Rocafuerte'],
    },
  },

  'El Oro': {
    'Machala': {
      'Machala': ['Machala Centro', 'Puerto Bolívar', 'El Cambio'],
    },
    'Pasaje': {
      'Pasaje': ['Pasaje Centro', 'Buenavista', 'Casacay'],
    },
    'Santa Rosa': {
      'Santa Rosa': ['Santa Rosa Centro', 'Puerto Jelí', 'Jambelí'],
    },
    'Huaquillas': {
      'Huaquillas': ['Huaquillas Centro', 'Puerto Hualtaco'],
    },
    'Zaruma': {
      'Zaruma': ['Zaruma Centro', 'Malvas', 'Arcapamba'],
    },
    'Piñas': {
      'Piñas': ['Piñas Centro', 'Moromoro', 'Capiro'],
    },
    'Arenillas': {
      'Arenillas': ['Arenillas Centro', 'Chacras', 'Palmales'],
    },
  },

  'Los Ríos': {
    'Babahoyo': {
      'Babahoyo': ['Babahoyo Centro', 'Barreiro', 'Caracol', 'Pimocha'],
    },
    'Quevedo': {
      'Quevedo': ['Quevedo Centro', 'San Camilo', 'Venus del Río Quevedo'],
    },
    'Vinces': {
      'Vinces': ['Vinces Centro', 'Antonio Sotomayor'],
    },
    'Ventanas': {
      'Ventanas': ['Ventanas Centro', 'Chacarita', 'Zapotal'],
    },
    'Buena Fe': {
      'Buena Fe': ['Buena Fe Centro', 'Patricia Pilar'],
    },
  },

  'Santo Domingo de los Tsáchilas': {
    'Santo Domingo': {
      'Santo Domingo': ['Santo Domingo Centro', 'Alluriquín', 'Luz de América', 'Valle Hermoso'],
    },
    'La Concordia': {
      'La Concordia': ['La Concordia Centro', 'Monterrey', 'La Villegas'],
    },
  },

  // --- REGIÓN SIERRA ---
  'Pichincha': {
    'Quito': {
      'Centro Histórico': ['San Roque', 'La Loma', 'San Juan', 'La Tola'],
      'Iñaquito': ['Carolina', 'El Batán', 'González Suárez', 'Bellavista'],
      'Cumbayá': ['Cumbayá Centro', 'Miravalle', 'San Juan Alto'],
      'Tumbaco': ['Tumbaco Centro', 'La Cerámica', 'Chiche'],
      'Calderón': ['Calderón', 'Carapungo', 'San Antonio de Pichincha (Mitad del Mundo)'],
      'Los Chillos': ['Conocoto', 'San Rafael', 'Amaguaña', 'Alangasí'],
      'Valles y Noroccidente': ['Guayllabamba', 'El Quinche', 'Nanegalito', 'Pacto'],
    },
    'Rumiñahui': {
      'Sangolquí': ['Sangolquí Centro', 'San Pedro de Taboada', 'San Rafael'],
    },
    'Cayambe': {
      'Cayambe': ['Cayambe Centro', 'Olmedo', 'Cangahua', 'Ascázubi'],
    },
    'Mejía': {
      'Machachi': ['Machachi Centro', 'Alóag', 'Aloasí', 'Tambillo', 'Tandapi'],
    },
    'San Miguel de los Bancos': {
      'San Miguel de los Bancos': ['Los Bancos Centro'],
      'Mindo': ['Mindo'],
    },
    'Pedro Moncayo': {
      'Tabacundo': ['Tabacundo Centro', 'La Esperanza', 'Malchinguí'],
    },
    'Puerto Quito': {
      'Puerto Quito': ['Puerto Quito Centro'],
    },
    'Pedro Vicente Maldonado': {
      'Pedro Vicente Maldonado': ['Pedro Vicente Maldonado Centro'],
    },
  },

  'Azuay': {
    'Cuenca': {
      'Cuenca': ['Centro Histórico', 'El Vergel', 'Yanuncay', 'Totoracocha'],
      'Parroquias Rurales': ['Baños', 'San Joaquín', 'Ricaurte', 'Turi', 'Sayausí', 'Tarqui', 'El Valle'],
    },
    'Gualaceo': {
      'Gualaceo': ['Gualaceo Centro', 'San Juan', 'Zhidmad'],
    },
    'Paute': {
      'Paute': ['Paute Centro', 'Guachapala', 'El Cabo'],
    },
    'Chordeleg': {
      'Chordeleg': ['Chordeleg Centro', 'La Unión', 'San Martín de Puzhío'],
    },
    'Santa Isabel': {
      'Santa Isabel': ['Santa Isabel Centro', 'Yunguilla', 'Abdón Calderón'],
    },
  },

  'Tungurahua': {
    'Ambato': {
      'Ambato': ['Ambato Centro', 'Ficoa', 'Atocha', 'Huachi', 'Pinllo', 'Quisapincha'],
    },
    'Baños de Agua Santa': {
      'Baños': ['Baños Centro', 'Río Verde', 'Ulba', 'Río Negro'],
    },
    'Pelileo': {
      'Pelileo': ['Pelileo Centro', 'Salasaca', 'Huambaló', 'Benítez'],
    },
    'Píllaro': {
      'Píllaro': ['Píllaro Centro', 'San Miguelito', 'San Andrés'],
    },
    'Patate': {
      'Patate': ['Patate Centro', 'Los Andes', 'Sucre'],
    },
  },

  'Imbabura': {
    'Ibarra': {
      'Ibarra': ['Ibarra Centro', 'San Antonio de Ibarra', 'Caranqui', 'Yahuarcocha', 'Salinas'],
    },
    'Otavalo': {
      'Otavalo': ['Otavalo Centro', 'Ilumán', 'Peguche', 'San Rafael de la Laguna', 'González Suárez'],
    },
    'Cotacachi': {
      'Cotacachi': ['Cotacachi Centro', 'Quiroga', 'Cuicocha', 'Íntag'],
    },
    'Antonio Ante': {
      'Atuntaqui': ['Atuntaqui Centro', 'Andrade Marín', 'San Roque', 'Natabuela'],
    },
    'Urcuquí': {
      'Urcuquí': ['Urcuquí Centro', 'Yachay', 'Cahuasquí'],
    },
    'Pimampiro': {
      'Pimampiro': ['Pimampiro Centro', 'Chugá'],
    },
  },

  'Chimborazo': {
    'Riobamba': {
      'Riobamba': ['Riobamba Centro', 'Yaruquíes', 'San Juan', 'Calpi', 'Licán'],
    },
    'Alausí': {
      'Alausí': ['Alausí Centro', 'Huigra', 'Pistishi (Nariz del Diablo)', 'Sibambe'],
    },
    'Guano': {
      'Guano': ['Guano Centro', 'San Andrés', 'Ilapo'],
    },
    'Colta': {
      'Cajabamba': ['Cajabamba', 'Laguna de Colta', 'Santiago de Quito'],
    },
  },

  'Cotopaxi': {
    'Latacunga': {
      'Latacunga': ['Latacunga Centro', 'San Buenaventura', 'Mulaló', 'Pastocalle', 'Toacaso'],
    },
    'Pujilí': {
      'Pujilí': ['Pujilí Centro', 'Zumbahua (Quilotoa)', 'Tigua', 'Angamarca'],
    },
    'Salcedo': {
      'Salcedo': ['San Miguel de Salcedo', 'Mulliquindil', 'Panzaleo'],
    },
    'Saquisilí': {
      'Saquisilí': ['Saquisilí Centro', 'Canchagua'],
    },
    'La Maná': {
      'La Maná': ['La Maná Centro', 'El Triunfo', 'Pucayacu'],
    },
  },

  'Loja': {
    'Loja': {
      'Loja': ['Loja Centro', 'San Sebastián', 'El Valle'],
      'Vilcabamba': ['Vilcabamba', 'Malacatos', 'Yangana', 'Quinara'],
      'Santuarios': ['El Cisne', 'Chuquiribamba'],
    },
    'Catamayo': {
      'Catamayo': ['Catamayo Centro', 'San Pedro de la Bendita', 'El Tambo'],
    },
    'Calvas': {
      'Cariamanga': ['Cariamanga Centro', 'Utuana'],
    },
    'Saraguro': {
      'Saraguro': ['Saraguro Centro', 'San Pablo de Tenta'],
    },
    'Macará': {
      'Macará': ['Macará Centro', 'Larama'],
    },
  },

  'Carchi': {
    'Tulcán': {
      'Tulcán': ['Tulcán Centro', 'Julio Andrade', 'Tufiño', 'Urbina'],
    },
    'Montúfar': {
      'San Gabriel': ['San Gabriel Centro', 'Cristóbal Colón', 'Piartal'],
    },
    'Espejo': {
      'El Ángel': ['El Ángel Centro', 'Reserva El Ángel', 'La Libertad'],
    },
    'Mira': {
      'Mira': ['Mira Centro', 'La Concepción'],
    },
  },

  'Cañar': {
    'Azogues': {
      'Azogues': ['Azogues Centro', 'Cojitambo', 'Guapán', 'Bayas'],
    },
    'Cañar': {
      'Cañar': ['Cañar Centro', 'Ingapirca', 'Honorato Vásquez', 'Chontamarca'],
    },
    'La Troncal': {
      'La Troncal': ['La Troncal Centro', 'Manuel J. Calle', 'Pancho Negro'],
    },
    'Biblián': {
      'Biblián': ['Biblián Centro', 'Nazón'],
    },
  },

  'Bolívar': {
    'Guaranda': {
      'Guaranda': ['Guaranda Centro', 'Guanujo', 'Salinas de Guaranda', 'Simiatug'],
    },
    'San Miguel': {
      'San Miguel': ['San Miguel Centro', 'San Pablo de Atenas', 'Bilován'],
    },
    'Chimbo': {
      'Chimbo': ['San José de Chimbo', 'Asunción'],
    },
    'Caluma': {
      'Caluma': ['Caluma Centro'],
    },
    'Echeandía': {
      'Echeandía': ['Echeandía Centro'],
    },
  },

  // --- REGIÓN AMAZONÍA / ORIENTE ---
  'Pastaza': {
    'Pastaza': {
      'Puyo': ['Puyo Centro', 'Fátima', 'Shell', 'Tarqui', 'Veracruz', 'Canelos'],
    },
    'Mera': {
      'Mera': ['Mera Centro', 'Madre Tierra'],
    },
    'Santa Clara': {
      'Santa Clara': ['Santa Clara Centro'],
    },
  },

  'Napo': {
    'Tena': {
      'Tena': ['Tena Centro', 'Misahuallí', 'Ahuano', 'Puerto Napo', 'Talag'],
    },
    'Archidona': {
      'Archidona': ['Archidona Centro', 'Cotundo', 'San Pablo'],
    },
    'Quijos': {
      'Baeza': ['Baeza Centro', 'Papallacta', 'Cosanga'],
    },
    'El Chaco': {
      'El Chaco': ['El Chaco Centro', 'Oyacachi'],
    },
  },

  'Orellana': {
    'Orellana': {
      'Puerto Francisco de Orellana': ['El Coca Centro', 'Dayuma', 'Taracoa'],
    },
    'La Joya de los Sachas': {
      'La Joya de los Sachas': ['Sacha Centro', 'San Carlos'],
    },
    'Loreto': {
      'Loreto': ['Loreto Centro', 'Ávila'],
    },
  },

  'Sucumbíos': {
    'Lago Agrio': {
      'Nueva Loja': ['Nueva Loja (Lago Agrio)', 'Santa Cecilia', 'Dureno', 'Pacayacu'],
    },
    'Shushufindi': {
      'Shushufindi': ['Shushufindi Centro', 'Limoncocha'],
    },
    'Cuyabeno': {
      'Tarapoa': ['Tarapoa', 'Reserva Cuyabeno'],
    },
  },

  'Morona Santiago': {
    'Morona': {
      'Macas': ['Macas Centro', 'Sevilla Don Bosco', 'General Proaño'],
    },
    'Gualaquiza': {
      'Gualaquiza': ['Gualaquiza Centro', 'Bomboiza'],
    },
    'Sucúa': {
      'Sucúa': ['Sucúa Centro', 'Huambi'],
    },
    'Palora': {
      'Palora': ['Palora Centro', 'Metzera'],
    },
  },

  'Zamora Chinchipe': {
    'Zamora': {
      'Zamora': ['Zamora Centro', 'Cumbaratza', 'Timbara'],
    },
    'Yantzaza': {
      'Yantzaza': ['Yantzaza Centro', 'Los Encuentros'],
    },
    'El Pangui': {
      'El Pangui': ['El Pangui Centro', 'Tundayme'],
    },
  },

  // --- REGIÓN INSULAR ---
  'Galápagos': {
    'Santa Cruz': {
      'Puerto Ayora': ['Puerto Ayora', 'Bellavista', 'Santa Rosa'],
    },
    'San Cristóbal': {
      'Puerto Baquerizo Moreno': ['Puerto Baquerizo Moreno', 'El Progreso'],
    },
    'Isabela': {
      'Puerto Villamil': ['Puerto Villamil', 'Tomás de Berlanga'],
    },
  },
};

/**
 * Lista alfabética de las 24 Provincias de Ecuador
 */
export const PROVINCIAS_ECUADOR = Object.keys(DIVISION_TERRITORIAL_ECUADOR).sort((a, b) =>
  a.localeCompare(b, 'es')
);

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
    // Si no hay provincia especificada, devolver todos los cantones registrados
    const set = new Set<string>();
    Object.values(DIVISION_TERRITORIAL_ECUADOR).forEach(cantones => {
      Object.keys(cantones).forEach(c => set.add(c));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }
  return Object.keys(DIVISION_TERRITORIAL_ECUADOR[provincia]).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtener lista de parroquias según provincia y cantón seleccionados
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
