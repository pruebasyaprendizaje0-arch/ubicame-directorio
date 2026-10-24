import { Lugar } from '@/types/lugar';

export interface CategoryStyle {
  borderColor: string;
  glowColor: string;
  name: string;
}

/**
 * Sistema de colores cromático por rubro/categoría para negocios de Ecuador
 * (Puro, sin dependencias de Leaflet/DOM para SSR seguro)
 */
export function getCategoryStyle(lugar: Lugar): CategoryStyle {
  // 1. Destacados / Clientes de ubicame.cc (prioridad máxima)
  if (lugar.prioridad === 1 || lugar.origen === 'ubicame_cc') {
    return {
      borderColor: '#f59e0b', // Gold / Amber
      glowColor: 'rgba(245, 158, 11, 0.45)',
      name: 'Destacado ubicame.cc',
    };
  }

  // 2. Puntos de referencia geográficos o turísticos
  if (lugar.es_referencia) {
    return {
      borderColor: '#a855f7', // Purple Neon
      glowColor: 'rgba(168, 85, 247, 0.45)',
      name: 'Punto de Referencia',
    };
  }

  const tipo = (lugar.tipo || '').toLowerCase();
  const icono = (lugar.icono || '').toLowerCase();

  // 3. Gastronomía, Cafeterías y Vida Nocturna
  if (
    tipo.includes('restaurante') ||
    tipo.includes('comida') ||
    tipo.includes('pizza') ||
    tipo.includes('asadero') ||
    tipo.includes('cafeter') ||
    tipo.includes('panader') ||
    tipo.includes('bar') ||
    tipo.includes('discoteca') ||
    tipo.includes('lounge') ||
    tipo.includes('licor') ||
    tipo.includes('gastronom') ||
    icono.includes('restaurante') ||
    icono.includes('cafeteria') ||
    icono.includes('bar')
  ) {
    return {
      borderColor: '#f97316', // Warm Orange
      glowColor: 'rgba(249, 115, 22, 0.45)',
      name: 'Gastronomía y Bares',
    };
  }

  // 4. Hoteles, Hospedaje y Cabañas
  if (
    tipo.includes('hotel') ||
    tipo.includes('hostal') ||
    tipo.includes('hospedaje') ||
    tipo.includes('cabaña') ||
    tipo.includes('cabana') ||
    tipo.includes('resort') ||
    tipo.includes('lodge') ||
    icono.includes('hotel')
  ) {
    return {
      borderColor: '#0284c7', // Sky / Ocean Blue
      glowColor: 'rgba(2, 132, 199, 0.45)',
      name: 'Hospedaje y Hoteles',
    };
  }

  // 5. Tiendas, Ropa, Artesanías y Comercio
  if (
    tipo.includes('tienda') ||
    tipo.includes('artesan') ||
    tipo.includes('bazar') ||
    tipo.includes('ropa') ||
    tipo.includes('moda') ||
    tipo.includes('catálogo') ||
    tipo.includes('catalogo') ||
    tipo.includes('souvenir') ||
    tipo.includes('supermercado') ||
    tipo.includes('minimarket') ||
    icono.includes('artesanias') ||
    icono.includes('supermercado')
  ) {
    return {
      borderColor: '#ec4899', // Pink / Magenta
      glowColor: 'rgba(236, 72, 153, 0.45)',
      name: 'Comercio y Tiendas',
    };
  }

  // 6. Salud, Belleza y Farmacias
  if (
    tipo.includes('farmacia') ||
    tipo.includes('botica') ||
    tipo.includes('salud') ||
    tipo.includes('medic') ||
    tipo.includes('médic') ||
    tipo.includes('dental') ||
    tipo.includes('clínic') ||
    tipo.includes('clinica') ||
    tipo.includes('spa') ||
    tipo.includes('estética') ||
    icono.includes('farmacia') ||
    icono.includes('salud')
  ) {
    return {
      borderColor: '#10b981', // Emerald Green
      glowColor: 'rgba(16, 185, 129, 0.45)',
      name: 'Salud y Farmacia',
    };
  }

  // 7. Servicios Técnicos y Transporte
  if (
    tipo.includes('taxi') ||
    tipo.includes('transporte') ||
    tipo.includes('servicio') ||
    tipo.includes('taller') ||
    tipo.includes('mecanic') ||
    tipo.includes('plomer') ||
    tipo.includes('electric') ||
    icono.includes('taxi') ||
    icono.includes('servicio')
  ) {
    return {
      borderColor: '#06b6d4', // Cyan
      glowColor: 'rgba(6, 182, 212, 0.45)',
      name: 'Servicios',
    };
  }

  // Por defecto (Cian elegante)
  return {
    borderColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    name: 'General',
  };
}

/**
 * Obtiene la imagen de portada / banner comercial del negocio en ubicame.cc
 * o un banner temático de alta resolución curado por categoría si no tiene foto aún.
 */
export function getCategoryCoverBanner(place: Lugar): string {
  // 1. Si el negocio ya cuenta con foto o banner comercial
  if (place.foto_url && (place.foto_url.startsWith('http') || place.foto_url.startsWith('/'))) {
    return place.foto_url;
  }

  // 2. Si es Gitana (Cliente oficial de Bikinis & Catálogo en Montañita)
  if (place.id_slug === 'gitana' || place.nombre.toLowerCase().includes('gitana')) {
    return 'https://lh3.googleusercontent.com/grass-cs/AABkmLdzW8bg1HYlFnCye4q9VTgl9t29GaMcP5HCFyvzqhKmLGRjUVTEF1Bt-xrk5rewvyqvBB6eRQVBGQQYBEaE7Zhm1_EqhUQc09Ohg2N8nV5he6m6mW47hU-XYpqmFvHFrXqHXv2r=w413-h240-k-no';
  }

  const tipo = (place.tipo || '').toLowerCase();
  const icono = (place.icono || '').toLowerCase();
  const nombre = (place.nombre || '').toLowerCase();

  // 3. Gastronomía, Pizzerías, Bares y Cafeterías
  if (
    tipo.includes('restaurante') ||
    tipo.includes('comida') ||
    tipo.includes('pizza') ||
    tipo.includes('asadero') ||
    tipo.includes('cafeter') ||
    tipo.includes('panader') ||
    tipo.includes('bar') ||
    tipo.includes('discoteca') ||
    tipo.includes('licor') ||
    tipo.includes('gastronom') ||
    icono.includes('restaurante') ||
    icono.includes('cafeteria') ||
    icono.includes('bar') ||
    nombre.includes('pizza') ||
    nombre.includes('restaurant') ||
    nombre.includes('sazon') ||
    nombre.includes('ezzio')
  ) {
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
  }

  // 4. Hoteles, Hostales, Hospedaje y Cabañas
  if (
    tipo.includes('hotel') ||
    tipo.includes('hostal') ||
    tipo.includes('hospedaje') ||
    tipo.includes('cabaña') ||
    tipo.includes('cabana') ||
    tipo.includes('resort') ||
    tipo.includes('lodge') ||
    icono.includes('hotel') ||
    nombre.includes('hostal') ||
    nombre.includes('hotel')
  ) {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  }

  // 5. Comercio, Ropa, Tiendas, Artesanías y Catálogos E-Commerce
  if (
    tipo.includes('tienda') ||
    tipo.includes('artesan') ||
    tipo.includes('bazar') ||
    tipo.includes('ropa') ||
    tipo.includes('moda') ||
    tipo.includes('catálogo') ||
    tipo.includes('catalogo') ||
    tipo.includes('souvenir') ||
    tipo.includes('supermercado') ||
    icono.includes('artesanias') ||
    icono.includes('supermercado')
  ) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80';
  }

  // 6. Salud, Farmacias y Belleza
  if (
    tipo.includes('farmacia') ||
    tipo.includes('botica') ||
    tipo.includes('salud') ||
    tipo.includes('medic') ||
    tipo.includes('médic') ||
    tipo.includes('dental') ||
    tipo.includes('clínic') ||
    tipo.includes('clinica') ||
    tipo.includes('spa') ||
    icono.includes('farmacia') ||
    icono.includes('salud')
  ) {
    return 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80';
  }

  // 7. Servicios Técnicos y Transporte
  if (
    tipo.includes('taxi') ||
    tipo.includes('transporte') ||
    tipo.includes('servicio') ||
    tipo.includes('taller') ||
    tipo.includes('mecanic') ||
    icono.includes('taxi') ||
    icono.includes('servicio')
  ) {
    return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80';
  }

  // 8. General / Puntos de interés y paisajes costeros de Ecuador
  return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';
}
