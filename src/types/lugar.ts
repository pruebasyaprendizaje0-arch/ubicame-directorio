export interface Lugar {
  id_slug: string;
  nombre: string;
  tipo: string;
  icono: string;           // ej: "restaurante.svg", "playa.svg", "bar.svg", "farmacia.svg", "taxi.svg"
  provincia: string;       // ej: "Santa Elena", "Guayas"
  ciudad: string;          // Cantón / Ciudad ej: "Santa Elena", "Salinas"
  zona: string;            // Comuna o Parroquia ej: "Olón", "Montañita", "Manglaralto", "Cadeate", "Ayangue"
  parroquia?: string;      // Parroquia específica (ej: "Manglaralto", "Colonche")
  comuna?: string;         // Comuna / Localidad específica
  latitud: number;
  longitud: number;
  es_referencia: boolean;
  es_servicio: boolean;
  prioridad: number;       // 1 = Cliente ubicame.cc (prioridad máxima), 2 = Verificado, 3 = Regular
  origen: 'ubicame_cc' | 'directorio_info';
  whatsapp?: string;       // Formato internacional ej: "593994765377"
  url_perfil?: string;     // URL hacia su menú o perfil en ubicame.cc
  estado: 'activo' | 'pendiente';
  descripcion?: string;
  foto_url?: string;
  distancia_km?: number;   // Calculado dinámicamente si se activa "Cerca de mí"
}

export interface PlaceFilters {
  search?: string;
  provincia?: string;
  canton?: string;
  ciudad?: string;
  parroquia?: string;
  comuna?: string;
  zona?: string;
  tipo?: string;
  solo_ubicame_cc?: boolean;
  cerca_de_mi?: boolean;
  user_lat?: number;
  user_lng?: number;
}
