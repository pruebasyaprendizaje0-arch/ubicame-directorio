import { NextRequest, NextResponse } from 'next/server';
import { syncUbicameCcWithDirectory } from '@/lib/ubicameSync';
import { invalidateUbicameCache } from '@/services/placesService';

export const runtime = 'nodejs';

/**
 * Webhook automático para ubicame.cc
 * Permite que cada vez que un negocio se registre o actualice en ubicame.cc,
 * se notifique a ubicame.info para invalidar la caché y asegurar que el negocio
 * aparezca de inmediato con sus coordenadas georreferenciadas (latitud y longitud).
 * 
 * Endpoints:
 * POST /api/webhooks/ubicame
 * GET  /api/webhooks/ubicame
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Invalidar caché en memoria para refresco instantáneo
    invalidateUbicameCache();

    // 2. Sincronizar negocios de ubicame.cc asegurando latitud y longitud
    const result = await syncUbicameCcWithDirectory();

    return NextResponse.json({
      success: true,
      message: `¡Webhook procesado! ${result.syncedCount} negocios de ubicame.cc sincronizados con latitud y longitud garantizadas.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error en webhook /api/webhooks/ubicame:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar webhook de ubicame.cc' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
