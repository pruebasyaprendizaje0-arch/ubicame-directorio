import { NextRequest, NextResponse } from 'next/server';
import { getAllAdminLugares, createLugar } from '@/services/placesService';
import { Lugar } from '@/types/lugar';
import { getCoordinatesForPlace } from '@/lib/geo';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const lugares = await getAllAdminLugares();
    return NextResponse.json({
      success: true,
      count: lugares.length,
      data: lugares,
    });
  } catch (error: any) {
    console.error('Error GET /api/admin/places:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener lugares' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nombre || !body.zona) {
      return NextResponse.json(
        { success: false, error: 'Nombre y Zona son obligatorios' },
        { status: 400 }
      );
    }

    const slugBase = body.id_slug || body.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const coords = getCoordinatesForPlace(
      body.zona,
      body.parroquia,
      body.ciudad,
      body.provincia,
      body.latitud,
      body.longitud,
      slugBase
    );

    const newLugar: Lugar = {
      id_slug: slugBase,
      nombre: body.nombre.trim(),
      tipo: body.tipo || 'General',
      icono: body.icono || 'lugar.svg',
      provincia: body.provincia || 'Santa Elena',
      ciudad: body.ciudad || 'Santa Elena',
      zona: body.zona.trim(),
      latitud: coords.lat,
      longitud: coords.lng,
      es_referencia: Boolean(body.es_referencia),
      es_servicio: Boolean(body.es_servicio),
      prioridad: Number(body.prioridad) || 3,
      origen: body.origen === 'ubicame_cc' ? 'ubicame_cc' : 'directorio_info',
      whatsapp: body.whatsapp || undefined,
      url_perfil: body.url_perfil || undefined,
      estado: body.estado === 'pendiente' ? 'pendiente' : 'activo',
      descripcion: body.descripcion || undefined,
      foto_url: body.foto_url || undefined,
    };

    const created = await createLugar(newLugar);

    return NextResponse.json({
      success: true,
      message: 'Lugar creado exitosamente',
      data: created,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/admin/places:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear lugar' },
      { status: 500 }
    );
  }
}
