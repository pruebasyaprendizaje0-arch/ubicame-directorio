import { NextRequest, NextResponse } from 'next/server';
import { getLugaresByOwnerEmail, getLugarBySlug } from '@/services/placesService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const slug = searchParams.get('slug');

    if (slug) {
      const place = await getLugarBySlug(slug);
      if (!place) {
        return NextResponse.json(
          { success: false, error: 'Negocio no encontrado' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: [place],
      });
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'El email del propietario es requerido' },
        { status: 400 }
      );
    }

    const places = await getLugaresByOwnerEmail(email);

    return NextResponse.json({
      success: true,
      count: places.length,
      data: places,
    });
  } catch (error: any) {
    console.error('Error en /api/owner/places:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener negocios del propietario' },
      { status: 500 }
    );
  }
}
