/**
 * Configurador inteligente de botones de acción para ubicame.info
 * Adapta el CTA principal según la vertical o categoría del negocio:
 * 
 * - Restaurantes / Gastronomía: "Ver Menú"
 * - Catálogos / Comercio E-Commerce: "Ver Catálogo"
 * - Servicios Técnicos: "Cotizar"
 * - Centros Médicos y Odontológicos: "Citas y Turnos"
 * - Alojamientos / Hospedaje: "Reservas"
 */

export interface PlaceActionConfig {
  label: string;          // Texto compacto para tarjetas y mapa (ej. "Ver Menú", "Ver Catálogo", "Cotizar", "Citas y Turnos", "Reservas")
  detailLabel: string;    // Texto descriptivo para modales (ej. "Ver Menú Digital", "Ver Catálogo Digital", "Cotizar Servicio", "Agendar Citas y Turnos", "Reservas Directas")
  actionType: 'menu' | 'catalog' | 'service' | 'appointments' | 'booking';
}

export function getPlaceActionConfig(place: {
  tipo?: string;
  icono?: string;
  nombre?: string;
  descripcion?: string;
  es_servicio?: boolean;
}): PlaceActionConfig {
  const tipo = (place.tipo || '').toLowerCase();
  const icono = (place.icono || '').toLowerCase();
  const name = (place.nombre || '').toLowerCase();
  const desc = (place.descripcion || '').toLowerCase();

  // 1. Alojamientos & Cabañas / Hostales / Hoteles -> "Reservas"
  if (
    tipo.includes('hospedaje') ||
    tipo.includes('cabaña') ||
    tipo.includes('cabana') ||
    tipo.includes('alojamiento') ||
    tipo.includes('hotel') ||
    icono.includes('hotel') ||
    name.includes('hostal') ||
    name.includes('hotel') ||
    name.includes('lodge') ||
    name.includes('cabaña') ||
    name.includes('cabana') ||
    name.includes('glamping') ||
    name.includes('suites') ||
    desc.includes('hospedaje') ||
    desc.includes('habitacion') ||
    desc.includes('reserva')
  ) {
    return {
      label: 'Reservas',
      detailLabel: 'Reservas Directas',
      actionType: 'booking',
    };
  }

  // 2. Centros Médicos y Odontológicos / Consultorios / Salud / Belleza / Spas -> "Citas y Turnos"
  if (
    tipo.includes('citas') ||
    tipo.includes('salud') ||
    tipo.includes('odontolog') ||
    tipo.includes('dent') ||
    tipo.includes('médic') ||
    tipo.includes('medic') ||
    tipo.includes('belleza') ||
    tipo.includes('spa') ||
    tipo.includes('estética') ||
    tipo.includes('estetica') ||
    icono.includes('salud') ||
    name.includes('clinica') ||
    name.includes('clínica') ||
    name.includes('dentista') ||
    name.includes('odont') ||
    name.includes('medico') ||
    name.includes('médico') ||
    name.includes('doctor') ||
    name.includes('barber') ||
    name.includes('spa') ||
    desc.includes('citas') ||
    desc.includes('consultas') ||
    desc.includes('turnos')
  ) {
    return {
      label: 'Citas y Turnos',
      detailLabel: 'Agendar Citas y Turnos',
      actionType: 'appointments',
    };
  }

  // 3. Servicios Técnicos / Plomeros / Electricistas / Cerrajeros / Talleres -> "Cotizar"
  if (
    tipo.includes('técnico') ||
    tipo.includes('tecnico') ||
    tipo.includes('servicio') ||
    icono.includes('servicio') ||
    name.includes('plomer') ||
    name.includes('electric') ||
    name.includes('cerraj') ||
    name.includes('reparac') ||
    name.includes('mantenimiento') ||
    name.includes('instalac') ||
    name.includes('taller') ||
    name.includes('mecanic') ||
    desc.includes('cotiz') ||
    (place.es_servicio && !tipo.includes('salud') && !tipo.includes('citas'))
  ) {
    return {
      label: 'Cotizar',
      detailLabel: 'Cotizar Servicio Express',
      actionType: 'service',
    };
  }

  // 4. Catálogos / Tiendas / Retail / E-Commerce / Boutiques -> "Ver Catálogo"
  if (
    tipo.includes('catálogo') ||
    tipo.includes('catalogo') ||
    tipo.includes('comercio') ||
    tipo.includes('artesanía') ||
    tipo.includes('artesania') ||
    tipo.includes('retail') ||
    tipo.includes('tienda') ||
    tipo.includes('boutique') ||
    tipo.includes('supermercado') ||
    icono.includes('supermercado') ||
    name.includes('liquor') ||
    name.includes('licor') ||
    name.includes('boutique') ||
    name.includes('tienda') ||
    name.includes('ropa') ||
    name.includes('zapater') ||
    name.includes('joyer') ||
    name.includes('msd') ||
    desc.includes('artículos') ||
    desc.includes('productos')
  ) {
    return {
      label: 'Ver Catálogo',
      detailLabel: 'Ver Catálogo Digital',
      actionType: 'catalog',
    };
  }

  // 5. Restaurantes / Gastronomía / Bares / Cafés (Predeterminado) -> "Ver Menú"
  return {
    label: 'Ver Menú',
    detailLabel: 'Ver Menú Digital',
    actionType: 'menu',
  };
}
