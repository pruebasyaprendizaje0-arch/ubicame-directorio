export interface Lugar {
  id_slug: string;           // Slug único del negocio (mismo de ubicame.cc)
  nombre: string;
  tipo: string;              // Categoría principal
  icono: string;             // Archivo SVG local en /public/icons/ (ej. restaurante.svg)
  provincia: string;
  ciudad: string;            // ej: Santa Elena, Guayaquil, Quito
  zona: string;              // ej: Montañita, Olón, Urdesa
  latitud: number;
  longitud: number;
  es_referencia: boolean;    // true para iglesias, parques, terminales
  es_servicio: boolean;
  prioridad: number;         // 1 = Cliente registrado en ubicame.cc, 2 = Verificado, 3 = Regular
  origen: 'ubicame_cc' | 'directorio_info';
  whatsapp?: string;         // Teléfono en formato 593...
  url_perfil?: string;       // Enlace a su landing/menú en ubicame.cc
  estado: 'activo' | 'pendiente';
  descripcion?: string;
  exactitud_gps?: 'rooftop' | 'interpolated' | 'approximate' | string;
}

export interface PlaceFilters {
  search?: string;
  provincia?: string;
  ciudad?: string;
  zona?: string;
  tipo?: string;
  prioridad?: number;
  es_referencia?: boolean;
  es_servicio?: boolean;
  solo_ubicame_cc?: boolean;
  estado?: 'activo' | 'pendiente' | 'todos';
}

export interface DirectoryStats {
  totalLugares: number;
  clientesUbicameCc: number;
  verificados: number;
  puntosReferencia: number;
  servicios: number;
  ciudadesCount: number;
  zonasCount: number;
}
