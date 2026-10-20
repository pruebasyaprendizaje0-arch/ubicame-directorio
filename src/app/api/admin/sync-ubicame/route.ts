import { NextRequest, NextResponse } from 'next/server';
import { syncUbicameCcWithDirectory } from '@/lib/ubicameSync';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const result = await syncUbicameCcWithDirectory();
    return NextResponse.json({
      success: true,
      message: `¡${result.syncedCount} negocios de ubicame.cc sincronizados con éxito!`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error en /api/admin/sync-ubicame:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al sincronizar con ubicame.cc' },
      { status: 500 }
    );
  }
}
