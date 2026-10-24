import { NextRequest, NextResponse } from 'next/server';
import { getLugarBySlug, updateLugar } from '@/services/placesService';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

function cleanPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

function isMatchingPhone(provided?: string, registered?: string): boolean {
  const p = cleanPhone(provided);
  const r = cleanPhone(registered);
  if (!p || !r) return false;
  if (p.length < 7 || r.length < 7) return false;
  return p.slice(-8) === r.slice(-8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_slug, foto_url, google_user, claim_whatsapp, admin_password } = body;

    if (!id_slug) {
      return NextResponse.json(
        { ok: false, error: 'El identificador (slug) del negocio es obligatorio.' },
        { status: 400 }
      );
    }

    // 1. Obtener el lugar actual
    const place = await getLugarBySlug(id_slug);
    if (!place) {
      return NextResponse.json(
        { ok: false, error: `No se encontró el negocio con slug "${id_slug}".` },
        { status: 404 }
      );
    }

    // 2. Verificar autorización: Negocio registrado o Super Admin
    const adminToken = request.cookies.get('admin_session')?.value;
    const adminSession = verifySessionToken(adminToken);
    const isSuperAdminCookie = Boolean(adminSession);
    const isSuperAdminPass = Boolean(
      admin_password &&
      admin_password.trim() === (process.env.ADMIN_PASSWORD || 'Frhc1971*')
    );
    const isSuperAdmin = isSuperAdminCookie || isSuperAdminPass;

    let isAuthorized = false;
    let authorLabel = '';

    const userEmail = google_user?.email?.toLowerCase().trim();

    // A. Super Admin: Autorización total para cualquier negocio o punto de interés
    if (isSuperAdmin) {
      isAuthorized = true;
      authorLabel = 'Super Administrador';
    }
    // B. Propietario vía WhatsApp registrado
    else if (claim_whatsapp) {
      if (place.whatsapp && isMatchingPhone(claim_whatsapp, place.whatsapp)) {
        isAuthorized = true;
        authorLabel = `Dueño Verificado (WhatsApp: ...${cleanPhone(claim_whatsapp).slice(-4)})`;
      } else {
        return NextResponse.json(
          {
            ok: false,
            error: `El número de WhatsApp ingresado no coincide con el registrado para "${place.nombre}". Solo el propietario del negocio o el Super Administrador pueden cambiar la portada.`,
          },
          { status: 403 }
        );
      }
    }
    // C. Propietario vía Google registrado
    else if (userEmail) {
      const placeOwnerEmail = (place.email_propietario || '').toLowerCase().trim();
      const descOwnerMatch = place.descripcion?.toLowerCase().includes(userEmail);

      if (placeOwnerEmail && (placeOwnerEmail === userEmail || descOwnerMatch)) {
        isAuthorized = true;
        authorLabel = `Dueño (${userEmail})`;
      } else if (!placeOwnerEmail && descOwnerMatch) {
        isAuthorized = true;
        authorLabel = `Dueño (${userEmail})`;
      } else {
        return NextResponse.json(
          {
            ok: false,
            error: `El correo "${userEmail}" no figura como propietario registrado de "${place.nombre}". Ingresa el WhatsApp del negocio o accede como Super Admin.`,
          },
          { status: 403 }
        );
      }
    }

    if (!isAuthorized) {
      if (place.es_referencia || !place.whatsapp) {
        return NextResponse.json(
          {
            ok: false,
            error: `"${place.nombre}" es un punto de interés público. Solo el Super Administrador puede actualizar su imagen de portada.`,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: 'Acceso denegado: Esta acción está reservada exclusivamente para el negocio registrado o para el Super Administrador.',
        },
        { status: 403 }
      );
    }

    // 3. Validar URL de foto (si se envió)
    const cleanedUrl = foto_url ? String(foto_url).trim() : null;
    if (cleanedUrl && !cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://') && !cleanedUrl.startsWith('/')) {
      return NextResponse.json(
        { ok: false, error: 'La URL de la imagen debe comenzar con https:// o http://' },
        { status: 400 }
      );
    }

    // 4. Actualizar en base de datos PostgreSQL o archivo JSON
    const updatedPlace = await updateLugar(id_slug, {
      foto_url: cleanedUrl || undefined,
    });

    return NextResponse.json({
      ok: true,
      mensaje: cleanedUrl
        ? '¡Imagen de portada actualizada exitosamente!'
        : '¡Imagen de portada restablecida al diseño de categoría por defecto!',
      lugar: updatedPlace,
      autor: authorLabel,
    });
  } catch (error: any) {
    console.error('Error en POST /api/owner/banner:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al actualizar la imagen de portada' },
      { status: 500 }
    );
  }
}
