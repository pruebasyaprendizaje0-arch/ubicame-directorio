import { NextRequest, NextResponse } from 'next/server';
import {
  getLugares,
  getZonas,
  getProvincias,
  getCantones,
  getParroquias,
} from '@/services/placesService';
import { PlaceFilters } from '@/types/lugar';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const userLat = searchParams.get('user_lat') ? parseFloat(searchParams.get('user_lat')!) : undefined;
    const userLng = searchParams.get('user_lng') ? parseFloat(searchParams.get('user_lng')!) : undefined;
    const cercaDeMi = searchParams.get('cerca_de_mi') === 'true';

    const filters: PlaceFilters = {
      search: searchParams.get('q') || searchParams.get('search') || undefined,
      provincia: searchParams.get('provincia') || undefined,
      canton: searchParams.get('canton') || searchParams.get('ciudad') || undefined,
      parroquia: searchParams.get('parroquia') || undefined,
      comuna: searchParams.get('comuna') || searchParams.get('zona') || undefined,
      zona: searchParams.get('zona') || searchParams.get('comuna') || undefined,
      tipo: searchParams.get('tipo') || undefined,
      solo_ubicame_cc: searchParams.get('solo_ubicame_cc') === 'true' ? true : undefined,
      cerca_de_mi: cercaDeMi,
      user_lat: userLat,
      user_lng: userLng,
    };

    const [lugares, zonas, provincias, cantones, parroquias] = await Promise.all([
      getLugares(filters),
      getZonas(),
      getProvincias(),
      getCantones(),
      getParroquias(),
    ]);

    return NextResponse.json({
      success: true,
      count: lugares.length,
      data: lugares,
      zonas,
      provincias,
      cantones,
      parroquias,
    });
  } catch (error: any) {
    console.error('API Error /api/places:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener lugares' },
      { status: 500 }
    );
  }
}
