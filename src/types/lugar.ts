export interface Lugar {
  id_slug: string;
  nombre: string;
  tipo: string;
  icono: string;           // ej: "restaurante.svg", "playa.svg", "bar.svg", "farmacia.svg", "taxi.svg"
  provincia: string;
  ciudad: string;
  zona: string;            // ej: "Olón", "Montañita", "Manglaralto"
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
}

export interface PlaceFilters {
  search?: string;
  zona?: string;
  tipo?: string;
  solo_ubicame_cc?: boolean;
}
