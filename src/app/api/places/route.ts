import { NextRequest, NextResponse } from 'next/server';
import { getLugares, getZonas } from '@/services/placesService';
import { PlaceFilters } from '@/types/lugar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: PlaceFilters = {
      search: searchParams.get('q') || searchParams.get('search') || undefined,
      zona: searchParams.get('zona') || undefined,
      tipo: searchParams.get('tipo') || undefined,
      solo_ubicame_cc: searchParams.get('solo_ubicame_cc') === 'true' ? true : undefined,
    };

    const [lugares, zonas] = await Promise.all([
      getLugares(filters),
      getZonas(),
    ]);

    return NextResponse.json({
      success: true,
      count: lugares.length,
      data: lugares,
      zonas,
    });
  } catch (error: any) {
    console.error('API Error /api/places:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener lugares' },
      { status: 500 }
    );
  }
}
