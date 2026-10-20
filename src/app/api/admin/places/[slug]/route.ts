import { NextRequest, NextResponse } from 'next/server';
import { getLugarBySlug, updateLugar, deleteLugar } from '@/services/placesService';

export const runtime = 'nodejs';

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

    return NextResponse.json({ success: true, data: lugar });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const updated = await updateLugar(slug, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'No se encontró el lugar para actualizar' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lugar actualizado exitosamente',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error PUT /api/admin/places/[slug]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar lugar' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const deleted = await deleteLugar(slug);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Lugar no encontrado o no pudo eliminarse' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lugar eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error DELETE /api/admin/places/[slug]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar lugar' },
      { status: 500 }
    );
  }
}
