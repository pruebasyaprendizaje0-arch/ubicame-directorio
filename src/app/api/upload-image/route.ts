import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Endpoint seguro para subir fotos a ImgBB protegiendo la API Key en el servidor
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'IMGBB_API_KEY no está configurada en las variables de entorno del servidor.' 
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No se envió ningún archivo de imagen' },
        { status: 400 }
      );
    }

    // Preparar formData hacia ImgBB
    const imgbbForm = new FormData();
    imgbbForm.append('image', imageFile);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: imgbbForm,
    });

    const imgbbData = await imgbbRes.json();

    if (!imgbbRes.ok || !imgbbData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: imgbbData?.error?.message || 'Error al procesar la imagen en ImgBB' 
        },
        { status: imgbbRes.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: imgbbData.data.url,
      thumb: imgbbData.data.thumb?.url || imgbbData.data.url,
      delete_url: imgbbData.data.delete_url,
    });
  } catch (error: any) {
    console.error('Error en /api/upload-image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error inesperado al subir imagen' },
      { status: 500 }
    );
  }
}
