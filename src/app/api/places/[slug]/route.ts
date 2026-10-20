import { NextRequest, NextResponse } from 'next/server';
import { getLugarBySlug } from '@/services/placesService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const lugar = await getLugarBySlug(slug);

    if (!lugar) {
      return NextResponse.json(
        { success: false, error: 'Lugar no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lugar,
    });
  } catch (error: any) {
    console.error('API Error /api/places/[slug]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error del servidor' },
      { status: 500 }
    );
  }
}
