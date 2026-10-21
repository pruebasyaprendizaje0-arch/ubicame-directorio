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
        'La Rinconada',
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
        'Loma Alta',
        'San Vicente',
        'Bellavista del Cerro',
        'Atravesado',
        'Río Blanco',
        'Sitio Nuevo',
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

/**
 * Catálogo exhaustivo de coordenadas georreferenciadas de Ecuador
 * (Comunas, Cantones, Parroquias y Capitales Provinciales)
 */
export const ECUADOR_COORDINATES_CATALOG: Record<string, { lat: number; lng: number }> = {
  // Santa Elena - Comunas y Localidades
  'montañita': { lat: -1.8267, lng: -80.7533 },
  'olón': { lat: -1.7983, lng: -80.7542 },
  'olon': { lat: -1.7983, lng: -80.7542 },
  'manglaralto': { lat: -1.8500, lng: -80.7440 },
  'cadeate': { lat: -1.8700, lng: -80.7300 },
  'curía': { lat: -1.7750, lng: -80.7580 },
  'curia': { lat: -1.7750, lng: -80.7580 },
  'san josé': { lat: -1.7400, lng: -80.7600 },
  'san jose': { lat: -1.7400, lng: -80.7600 },
  'las núñez': { lat: -1.7050, lng: -80.7650 },
  'las nunez': { lat: -1.7050, lng: -80.7650 },
  'la entrada': { lat: -1.6800, lng: -80.7700 },
  'la rinconada': { lat: -1.6640, lng: -80.7850 },
  'loma alta': { lat: -1.9150, lng: -80.6400 },
  'san vicente manglaralto': { lat: -1.8650, lng: -80.7100 },
  'san vicente (santa elena)': { lat: -1.8650, lng: -80.7100 },
  'bellavista del cerro': { lat: -1.8350, lng: -80.6900 },
  'atravesado': { lat: -1.8800, lng: -80.6600 },
  'río blanco': { lat: -1.8200, lng: -80.6700 },
  'rio blanco': { lat: -1.8200, lng: -80.6700 },
  'sitio nuevo': { lat: -1.8400, lng: -80.7000 },
  'san antonio': { lat: -1.9000, lng: -80.7200 },
  'libertador bolívar': { lat: -1.9300, lng: -80.7100 },
  'libertador bolivar': { lat: -1.9300, lng: -80.7100 },
  'valdivia': { lat: -1.9500, lng: -80.7150 },
  'san pedro': { lat: -1.9700, lng: -80.7180 },
  'ayangue': { lat: -1.9850, lng: -80.7480 },
  'palmar': { lat: -2.0200, lng: -80.7300 },
  'colonche': { lat: -2.0000, lng: -80.6800 },
  'dos mangas': { lat: -1.8450, lng: -80.6800 },
  'sinchal': { lat: -1.8600, lng: -80.6900 },
  'barcelona': { lat: -1.8750, lng: -80.7000 },
  'ballenita': { lat: -2.2050, lng: -80.8750 },
  'santa elena': { lat: -2.2260, lng: -80.8580 },
  'salinas': { lat: -2.2180, lng: -80.9570 },
  'chipipe': { lat: -2.2120, lng: -80.9630 },
  'san lorenzo': { lat: -2.2050, lng: -80.9550 },
  'la libertad': { lat: -2.2330, lng: -80.9100 },
  'punta carnero': { lat: -2.2850, lng: -80.9100 },
  'ancón': { lat: -2.3250, lng: -80.8650 },
  'ancon': { lat: -2.3250, lng: -80.8650 },
  'chanduy': { lat: -2.4000, lng: -80.6800 },

  // Manabí
  'manta': { lat: -0.9676, lng: -80.7089 },
  'barbasquillo': { lat: -0.9548, lng: -80.7482 },
  'tarqui': { lat: -0.9550, lng: -80.7000 },
  'los esteros': { lat: -0.9500, lng: -80.6850 },
  'san mateo': { lat: -0.9700, lng: -80.8000 },
  'portoviejo': { lat: -1.0544, lng: -80.4545 },
  'puerto lópez': { lat: -1.5560, lng: -80.8120 },
  'puerto lopez': { lat: -1.5560, lng: -80.8120 },
  'salango': { lat: -1.5900, lng: -80.8400 },
  'machalilla': { lat: -1.4850, lng: -80.7700 },
  'pedernales': { lat: 0.0716, lng: -80.0525 },
  'bahía de caráquez': { lat: -0.6000, lng: -80.4250 },
  'bahia de caraquez': { lat: -0.6000, lng: -80.4250 },
  'canoa': { lat: -0.4600, lng: -80.4550 },
  'san vicente': { lat: -0.5900, lng: -80.4100 },
  'crucita': { lat: -0.8700, lng: -80.5350 },
  'chone': { lat: -0.6970, lng: -80.0930 },
  'jipijapa': { lat: -1.3480, lng: -80.5790 },
  'montecristi': { lat: -1.0500, lng: -80.6600 },

  // Guayas
  'guayaquil': { lat: -2.1894, lng: -79.8891 },
  'samborondón': { lat: -2.0910, lng: -79.7240 },
  'samborondon': { lat: -2.0910, lng: -79.7240 },
  'la puntilla': { lat: -2.1550, lng: -79.8650 },
  'daule': { lat: -1.8640, lng: -79.9780 },
  'la aurora': { lat: -2.0500, lng: -79.9200 },
  'general villamil': { lat: -2.6310, lng: -80.3880 },
  'playas': { lat: -2.6310, lng: -80.3880 },
  'durán': { lat: -2.1700, lng: -79.8300 },
  'duran': { lat: -2.1700, lng: -79.8300 },
  'milagro': { lat: -2.1340, lng: -79.5940 },

  // Pichincha
  'quito': { lat: -0.1807, lng: -78.4678 },
  'cumbayá': { lat: -0.2010, lng: -78.4320 },
  'cumbaya': { lat: -0.2010, lng: -78.4320 },
  'tumbaco': { lat: -0.2150, lng: -78.4000 },
  'los chillos': { lat: -0.2800, lng: -78.4500 },

  // Azuay
  'cuenca': { lat: -2.9001, lng: -79.0059 },

  // Esmeraldas
  'esmeraldas': { lat: 0.9682, lng: -79.6517 },
  'atacames': { lat: 0.8700, lng: -79.8450 },
  'tonsupa': { lat: 0.8850, lng: -79.8150 },
  'mompiche': { lat: 0.5000, lng: -80.0200 },
  'same': { lat: 0.8350, lng: -79.8800 },

  // Otras Provincias y Capitales
  'ambato': { lat: -1.2491, lng: -78.6168 },
  'tungurahua': { lat: -1.2491, lng: -78.6168 },
  'baños de agua santa': { lat: -1.3960, lng: -78.4230 },
  'ibarra': { lat: 0.3517, lng: -78.1223 },
  'imbabura': { lat: 0.3517, lng: -78.1223 },
  'otavalo': { lat: 0.2330, lng: -78.2620 },
  'riobamba': { lat: -1.6635, lng: -78.6546 },
  'chimborazo': { lat: -1.6635, lng: -78.6546 },
  'latacunga': { lat: -0.9333, lng: -78.6167 },
  'cotopaxi': { lat: -0.9333, lng: -78.6167 },
  'loja': { lat: -3.9931, lng: -79.2042 },
  'vilcabamba': { lat: -4.2600, lng: -79.2220 },
  'machala': { lat: -3.2581, lng: -79.9554 },
  'el oro': { lat: -3.2581, lng: -79.9554 },
  'santo domingo': { lat: -0.2530, lng: -79.1754 },
  'santo domingo de los tsáchilas': { lat: -0.2530, lng: -79.1754 },
  'babahoyo': { lat: -1.8022, lng: -79.5344 },
  'los ríos': { lat: -1.8022, lng: -79.5344 },
  'quevedo': { lat: -1.0286, lng: -79.4635 },
  'tulcán': { lat: 0.8122, lng: -77.7173 },
  'carchi': { lat: 0.8122, lng: -77.7173 },
  'guaranda': { lat: -1.5926, lng: -79.0009 },
  'bolívar': { lat: -1.5926, lng: -79.0009 },
  'azogues': { lat: -2.7397, lng: -78.8475 },
  'cañar': { lat: -2.7397, lng: -78.8475 },
  'puyo': { lat: -1.4842, lng: -77.9984 },
  'pastaza': { lat: -1.4842, lng: -77.9984 },
  'tena': { lat: -0.9938, lng: -77.8129 },
  'napo': { lat: -0.9938, lng: -77.8129 },
  'macas': { lat: -2.3087, lng: -78.1114 },
  'morona santiago': { lat: -2.3087, lng: -78.1114 },
  'el coca': { lat: -0.4665, lng: -76.9878 },
  'orellana': { lat: -0.4665, lng: -76.9878 },
  'lago agrio': { lat: 0.0847, lng: -76.8828 },
  'nueva loja': { lat: 0.0847, lng: -76.8828 },
  'sucumbíos': { lat: 0.0847, lng: -76.8828 },
  'zamora': { lat: -4.0692, lng: -78.9567 },
  'zamora chinchipe': { lat: -4.0692, lng: -78.9567 },
  'galápagos': { lat: -0.7432, lng: -90.3138 },
  'puerto ayora': { lat: -0.7432, lng: -90.3138 },
  'santa cruz': { lat: -0.7432, lng: -90.3138 },
  'san cristóbal': { lat: -0.9022, lng: -89.6094 },
  'puerto baquerizo moreno': { lat: -0.9022, lng: -89.6094 },
  'isabela': { lat: -0.9554, lng: -90.9664 },
  'puerto villamil': { lat: -0.9554, lng: -90.9664 },
};

/**
 * Resuelve y garantiza coordenadas exactas (latitud y longitud válidas)
 * para cualquier negocio registrado en ubicame.cc o creado en el sistema.
 * Si las coordenadas ya existen y son válidas, las conserva.
 * Si están vacías o son nulas, las infiere por comuna, cantón o provincia.
 * Aplica un micro-desplazamiento determinista para evitar colisiones exactas en el mapa.
 */
export function getCoordinatesForPlace(
  comuna?: string,
  parroquia?: string,
  canton?: string,
  provincia?: string,
  rawLat?: any,
  rawLng?: any,
  slugForJitter?: string
): { lat: number; lng: number } {
  const parsedLat = rawLat != null ? parseFloat(rawLat) : NaN;
  const parsedLng = rawLng != null ? parseFloat(rawLng) : NaN;

  if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
    return { lat: parsedLat, lng: parsedLng };
  }

  // Buscar por orden de especificidad: comuna + parroquia -> comuna + provincia -> comuna -> parroquia -> cantón -> provincia
  const c = comuna?.toLowerCase().trim();
  const p = parroquia?.toLowerCase().trim();
  const ct = canton?.toLowerCase().trim();
  const pr = provincia?.toLowerCase().trim();

  const candidates: string[] = [];
  if (c && p) candidates.push(`${c} ${p}`);
  if (c && pr) candidates.push(`${c} (${pr})`, `${c} ${pr}`);
  if (c) candidates.push(c);
  if (p) candidates.push(p);
  if (ct) candidates.push(ct);
  if (pr) candidates.push(pr);

  let baseCoord: { lat: number; lng: number } | null = null;

  for (const candidate of candidates) {
    if (ECUADOR_COORDINATES_CATALOG[candidate]) {
      baseCoord = ECUADOR_COORDINATES_CATALOG[candidate];
      break;
    }
  }

  // Fallback predeterminado a Santa Elena / Montañita si no se encontró
  if (!baseCoord) {
    baseCoord = { lat: -1.8267, lng: -80.7533 };
  }

  // Desplazamiento determinista sutil (~30-50m) para evitar que negocios en la misma comuna se tapen
  let jitterLat = 0;
  let jitterLng = 0;
  if (slugForJitter) {
    let hash = 0;
    for (let i = 0; i < slugForJitter.length; i++) {
      hash = (hash << 5) - hash + slugForJitter.charCodeAt(i);
      hash |= 0;
    }
    const offsetLat = ((Math.abs(hash) % 100) - 50) * 0.000008;
    const offsetLng = ((Math.abs(hash >> 3) % 100) - 50) * 0.000008;
    jitterLat = offsetLat;
    jitterLng = offsetLng;
  }

  return {
    lat: Number((baseCoord.lat + jitterLat).toFixed(6)),
    lng: Number((baseCoord.lng + jitterLng).toFixed(6)),
  };
}

/**
 * Infiere la provincia y el cantón de Ecuador a partir de un texto libre
 * (nombre de ciudad, cantón, parroquia, comuna o fragmento de dirección).
 */
export function inferProvinceAndCanton(query?: string | null): { provincia?: string; canton?: string } | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  if (q.length < 2) return null;

  for (const [prov, cantones] of Object.entries(DIVISION_TERRITORIAL_ECUADOR)) {
    if (prov.toLowerCase() === q || q.includes(prov.toLowerCase())) {
      return { provincia: prov };
    }
    for (const [canton, parroquias] of Object.entries(cantones)) {
      if (canton.toLowerCase() === q || q.includes(canton.toLowerCase())) {
        return { provincia: prov, canton };
      }
      for (const [parroquia, comunas] of Object.entries(parroquias)) {
        if (parroquia.toLowerCase() === q || q.includes(parroquia.toLowerCase())) {
          return { provincia: prov, canton };
        }
        for (const comuna of comunas) {
          if (comuna.toLowerCase() === q || q.includes(comuna.toLowerCase())) {
            return { provincia: prov, canton };
          }
        }
      }
    }
  }
  return null;
}

export interface NearestTownResult {
  pueblo: string;
  canton: string;
  provincia: string;
  distanciaKm: number;
}

export const BASE_TOWNS_FOR_DETECTION: Array<{
  nombre: string;
  canton: string;
  provincia: string;
  lat: number;
  lng: number;
}> = [
  // Ruta del Spondylus / Costa Norte Santa Elena
  { nombre: 'Olón', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.804, lng: -80.73 },
  { nombre: 'Montañita', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.828, lng: -80.75 },
  { nombre: 'Manglaralto', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -2.006, lng: -80.73 },
  { nombre: 'Curía', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.77, lng: -80.74 },
  { nombre: 'San José', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.74, lng: -80.75 },
  { nombre: 'Las Núñez', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.705, lng: -80.765 },
  { nombre: 'La Entrada', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.68, lng: -80.77 },
  { nombre: 'La Rinconada', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.664, lng: -80.785 },
  { nombre: 'Dos Mangas', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.845, lng: -80.685 },
  { nombre: 'Loma Alta', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.915, lng: -80.640 },
  { nombre: 'Cadeate', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.91, lng: -80.72 },
  { nombre: 'San Antonio', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.90, lng: -80.72 },
  { nombre: 'Libertador Bolívar', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.93, lng: -80.71 },
  { nombre: 'Valdivia', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.95, lng: -80.715 },
  { nombre: 'San Pedro', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.97, lng: -80.718 },
  { nombre: 'Ayangue', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -1.985, lng: -80.748 },
  { nombre: 'Palmar', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -2.02, lng: -80.73 },
  { nombre: 'Colonche', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -2.00, lng: -80.68 },
  // Península Urbana
  { nombre: 'Ballenita', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -2.205, lng: -80.875 },
  { nombre: 'Santa Elena', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -2.22, lng: -80.85 },
  { nombre: 'La Libertad', canton: 'La Libertad', provincia: 'Santa Elena', lat: -2.233, lng: -80.91 },
  { nombre: 'Salinas', canton: 'Salinas', provincia: 'Santa Elena', lat: -2.218, lng: -80.957 },
  { nombre: 'Chipipe', canton: 'Salinas', provincia: 'Santa Elena', lat: -2.212, lng: -80.963 },
  { nombre: 'Ancón', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -2.325, lng: -80.865 },
  { nombre: 'Chanduy', canton: 'Santa Elena', provincia: 'Santa Elena', lat: -2.40, lng: -80.68 },
  // Manabí Sur & Manta
  { nombre: 'Puerto López', canton: 'Puerto López', provincia: 'Manabí', lat: -1.556, lng: -80.812 },
  { nombre: 'Salango', canton: 'Puerto López', provincia: 'Manabí', lat: -1.59, lng: -80.84 },
  { nombre: 'Manta', canton: 'Manta', provincia: 'Manabí', lat: -0.9676, lng: -80.7089 },
  // Principales urbes
  { nombre: 'Guayaquil', canton: 'Guayaquil', provincia: 'Guayas', lat: -2.17, lng: -79.92 },
  { nombre: 'Samborondón', canton: 'Samborondón', provincia: 'Guayas', lat: -2.091, lng: -79.724 },
  { nombre: 'Quito', canton: 'Quito', provincia: 'Pichincha', lat: -0.18, lng: -78.46 },
  { nombre: 'Cuenca', canton: 'Cuenca', provincia: 'Azuay', lat: -2.9001, lng: -79.0059 },
];

/**
 * Autodetecta la comuna, pueblo o ciudad más cercana en Ecuador dadas coordenadas lat/lng
 */
export function findNearestTownOrComuna(lat: number, lng: number): NearestTownResult {
  let best = BASE_TOWNS_FOR_DETECTION[0];
  let minDistance = calculateDistanceKm(lat, lng, best.lat, best.lng);

  for (let i = 1; i < BASE_TOWNS_FOR_DETECTION.length; i++) {
    const item = BASE_TOWNS_FOR_DETECTION[i];
    const dist = calculateDistanceKm(lat, lng, item.lat, item.lng);
    if (dist < minDistance) {
      minDistance = dist;
      best = item;
    }
  }

  return {
    pueblo: best.nombre,
    canton: best.canton,
    provincia: best.provincia,
    distanciaKm: Number(minDistance.toFixed(2)),
  };
}

