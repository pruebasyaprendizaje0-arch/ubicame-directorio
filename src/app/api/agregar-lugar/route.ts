import { NextRequest, NextResponse } from 'next/server';
import { createLugar } from '@/services/placesService';
import { Lugar } from '@/types/lugar';
import { findNearestTownOrComuna } from '@/lib/geo';

export const runtime = 'nodejs';

// Cache en memoria para control anti-spam por IP (3 registros por IP por hora)
interface IpRateRecord {
  timestamps: number[];
}
const ipRateLimitMap = new Map<string, IpRateRecord>();
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRateLimitMap.get(ip);

  if (!record) {
    ipRateLimitMap.set(ip, { timestamps: [now] });
    return false;
  }

  // Filtrar timestamps de hace más de 1 hora
  const recentTimestamps = record.timestamps.filter(t => now - t < ONE_HOUR_MS);

  if (recentTimestamps.length >= MAX_REQUESTS_PER_HOUR) {
    return true;
  }

  recentTimestamps.push(now);
  ipRateLimitMap.set(ip, { timestamps: recentTimestamps });
  return false;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveIconForType(tipo: string): string {
  const t = tipo.toLowerCase();
  if (t.includes('restaurante') || t.includes('comida') || t.includes('asadero')) return 'restaurante.svg';
  if (t.includes('cafeteria') || t.includes('cafetería') || t.includes('panaderia') || t.includes('dulce')) return 'cafeteria.svg';
  if (t.includes('farmacia') || t.includes('botica')) return 'farmacia.svg';
  if (t.includes('hostal') || t.includes('hotel') || t.includes('hospedaje') || t.includes('cabaña') || t.includes('cabana')) return 'hotel.svg';
  if (t.includes('bar') || t.includes('discoteca') || t.includes('lounge') || t.includes('licorer')) return 'bar.svg';
  if (t.includes('taxi') || t.includes('transporte') || t.includes('mototaxi')) return 'taxi.svg';
  if (t.includes('iglesia') || t.includes('capilla') || t.includes('parroquia')) return 'iglesia.svg';
  if (t.includes('tienda') || t.includes('abarrotes') || t.includes('bazar') || t.includes('supermercado') || t.includes('minimarket')) return 'supermercado.svg';
  if (t.includes('cancha') || t.includes('parque') || t.includes('estadio') || t.includes('playa')) return 'parque.svg';
  if (t.includes('artesania') || t.includes('artesanía') || t.includes('souvenir')) return 'artesanias.svg';
  if (t.includes('salud') || t.includes('medico') || t.includes('médico') || t.includes('dental') || t.includes('clinica')) return 'salud.svg';
  if (t.includes('servicio') || t.includes('taller') || t.includes('mecanic') || t.includes('plomer') || t.includes('electric')) return 'servicio.svg';
  return 'lugar.svg';
}

function isReferenceType(tipo: string): boolean {
  const t = tipo.toLowerCase();
  const refKeywords = ['tienda', 'farmacia', 'abarrotes', 'bazar', 'cancha', 'iglesia', 'parque', 'supermercado', 'minimarket', 'estadio'];
  return refKeywords.some(keyword => t.includes(keyword));
}

function isServiceType(tipo: string): boolean {
  const t = tipo.toLowerCase();
  const servKeywords = ['taxi', 'servicio', 'plomero', 'mecanico', 'mecánico', 'tecnico', 'técnico', 'electricista', 'cerrajero'];
  return servKeywords.some(keyword => t.includes(keyword));
}

export async function POST(request: NextRequest) {
  try {
    // 1. Obtener IP y aplicar rate-limiting anti-spam
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1');

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Has alcanzado el límite de 3 registros por hora desde esta conexión. Por favor intenta más tarde.',
        },
        { status: 429 }
      );
    }

    // 2. Parsear body
    const body = await request.json();
    const { nombre, tipo, lat, lng, latitud, longitud, whatsapp, foto_url, google_user, email_propietario, nombre_propietario } = body;

    const verifiedEmail = google_user?.email || email_propietario;
    const verifiedName = google_user?.name || nombre_propietario;

    // 3. Validaciones
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3) {
      return NextResponse.json(
        { ok: false, error: 'El nombre del negocio debe tener al menos 3 caracteres.' },
        { status: 400 }
      );
    }

    const parsedLat = parseFloat(lat ?? latitud);
    const parsedLng = parseFloat(lng ?? longitud);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return NextResponse.json(
        { ok: false, error: 'Las coordenadas de ubicación (latitud y longitud) son obligatorias.' },
        { status: 400 }
      );
    }

    // Validación geográfica de Ecuador (Latitud: -5.5 a 1.6, Longitud: -91.5 a -75.0)
    if (parsedLat < -5.5 || parsedLat > 1.6 || parsedLng < -91.5 || parsedLng > -75.0) {
      return NextResponse.json(
        { ok: false, error: 'La ubicación seleccionada está fuera de las coordenadas de Ecuador.' },
        { status: 400 }
      );
    }

    const sanitizedTipo = (tipo || 'Otro').trim();

    // 4. Autodetección del pueblo / comuna más cercano
    const nearest = findNearestTownOrComuna(parsedLat, parsedLng);
    const puebloDetectado = nearest.pueblo;
    const cantonDetectado = nearest.canton;
    const provinciaDetectada = nearest.provincia;

    // 5. Generar slug único
    const baseSlug = slugify(`${nombre.trim()}-${puebloDetectado}`);
    const uniqueSuffix = Math.random().toString(36).substring(2, 6);
    const id_slug = `${baseSlug}-${uniqueSuffix}`;

    let desc = `Registro rápido comunitario. Cerca de ${puebloDetectado} (${nearest.distanciaKm} km). IP: ${clientIp}`;
    if (verifiedEmail) {
      desc += ` | Cuenta Google: ${verifiedName || ''} <${verifiedEmail}> (Verificada)`;
    }

    // 6. Preparar objeto Lugar para Postgres
    const newLugar: Lugar = {
      id_slug,
      nombre: nombre.trim(),
      tipo: sanitizedTipo,
      icono: resolveIconForType(sanitizedTipo),
      provincia: provinciaDetectada,
      ciudad: cantonDetectado,
      zona: puebloDetectado,
      latitud: parsedLat,
      longitud: parsedLng,
      es_referencia: isReferenceType(sanitizedTipo),
      es_servicio: isServiceType(sanitizedTipo),
      prioridad: verifiedEmail ? 2 : 3, // Prioridad 2 (Verificado por Google)
      origen: 'directorio_info',
      whatsapp: whatsapp ? whatsapp.trim().replace(/[^\d+]/g, '') : undefined,
      foto_url: foto_url ? foto_url.trim() : undefined,
      estado: 'pendiente', // ¡Estado pendiente para moderación en admin!
      descripcion: desc,
      email_propietario: verifiedEmail,
      nombre_propietario: verifiedName,
    };

    // 7. Insertar en la base de datos
    const saved = await createLugar(newLugar);

    return NextResponse.json({
      ok: true,
      id: saved.id_slug,
      pueblo: puebloDetectado,
      distanciaKm: nearest.distanciaKm,
      mensaje: 'Registro recibido exitosamente. Revisaremos tu negocio en 24h para que aparezca en el mapa.',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/agregar-lugar:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al procesar el registro del lugar' },
      { status: 500 }
    );
  }
}
