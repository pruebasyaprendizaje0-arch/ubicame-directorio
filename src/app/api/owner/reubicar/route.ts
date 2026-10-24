import { NextRequest, NextResponse } from 'next/server';
import { getLugarBySlug, updateLugar } from '@/services/placesService';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

function cleanPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Valida si el teléfono provisto coincide con el registrado del negocio.
 * Compara los últimos 8 dígitos para ser inmune a formatos con/sin código de país (593) o cero inicial (09).
 */
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
    const { id_slug, latitud, longitud, google_user, claim_whatsapp, admin_password, foto_url } = body;

    if (!id_slug) {
      return NextResponse.json(
        { ok: false, error: 'El identificador (slug) del negocio es obligatorio.' },
        { status: 400 }
      );
    }

    const parsedLat = parseFloat(latitud);
    const parsedLng = parseFloat(longitud);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return NextResponse.json(
        { ok: false, error: 'Las coordenadas GPS (latitud y longitud) son requeridas y deben ser numéricas.' },
        { status: 400 }
      );
    }

    // Validación geográfica de Ecuador (Latitud: -5.5 a 1.6, Longitud: -91.5 a -75.0)
    if (parsedLat < -5.5 || parsedLat > 1.6 || parsedLng < -91.5 || parsedLng > -75.0) {
      return NextResponse.json(
        { ok: false, error: 'La ubicación seleccionada está fuera de los límites geográficos de Ecuador.' },
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

    // 2. Verificar autorización: SOLO el negocio registrado o el Super Admin
    const adminToken = request.cookies.get('admin_session')?.value;
    const adminSession = verifySessionToken(adminToken);
    const isSuperAdminCookie = Boolean(adminSession);
    const isSuperAdminPass = Boolean(
      admin_password &&
      admin_password.trim() === (process.env.ADMIN_PASSWORD || 'Frhc1971*')
    );
    const isSuperAdmin = isSuperAdminCookie || isSuperAdminPass;

    let isAuthorized = false;
    let shouldClaimOwnership = false;
    let claimEmail = '';
    let claimName = '';
    let authorLabel = '';

    const userEmail = google_user?.email?.toLowerCase().trim();
    const userName = google_user?.name?.trim() || 'Propietario Verificado';

    // A. Super Admin: Autorización total
    if (isSuperAdmin) {
      isAuthorized = true;
      authorLabel = 'Super Administrador';
    }
    // B. Propietario del negocio vía WhatsApp registrado
    else if (claim_whatsapp) {
      if (place.whatsapp && isMatchingPhone(claim_whatsapp, place.whatsapp)) {
        isAuthorized = true;
        shouldClaimOwnership = true;
        claimEmail = `whatsapp:${cleanPhone(claim_whatsapp)}`;
        claimName = place.nombre;
        authorLabel = `Dueño Verificado (WhatsApp: ...${cleanPhone(claim_whatsapp).slice(-4)})`;
      } else {
        return NextResponse.json(
          {
            ok: false,
            error: `El número de WhatsApp ingresado no coincide con el teléfono registrado para "${place.nombre}". Solo el propietario del negocio o el Super Administrador pueden reubicarlo.`,
          },
          { status: 403 }
        );
      }
    }
    // C. Propietario del negocio vía cuenta de Google registrada
    else if (userEmail) {
      const placeOwnerEmail = (place.email_propietario || '').toLowerCase().trim();
      const descOwnerMatch = place.descripcion?.toLowerCase().includes(userEmail);

      if (placeOwnerEmail && (placeOwnerEmail === userEmail || descOwnerMatch)) {
        isAuthorized = true;
        authorLabel = `Dueño (${userEmail})`;
      } else if (!placeOwnerEmail && descOwnerMatch) {
        isAuthorized = true;
        authorLabel = `Dueño (${userEmail})`;
      } else if (placeOwnerEmail && placeOwnerEmail !== userEmail) {
        return NextResponse.json(
          {
            ok: false,
            error: `Este negocio ya está vinculado al propietario ${placeOwnerEmail}. Solo ese propietario o el Super Administrador pueden reubicar su icono.`,
          },
          { status: 403 }
        );
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

    // Si no cumplió ninguna de las condiciones anteriores, DENEGAR rotundamente
    if (!isAuthorized) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Acceso denegado: Esta acción está reservada exclusivamente para el negocio registrado o para el Super Administrador.',
        },
        { status: 403 }
      );
    }

    // 3. Proceder a la reubicación exacta con 6 decimales de precisión
    const updates: any = {
      latitud: Number(parsedLat.toFixed(6)),
      longitud: Number(parsedLng.toFixed(6)),
      exactitud_gps: 'rooftop',
    };

    if (foto_url !== undefined) {
      const cleanBanner = foto_url ? String(foto_url).trim() : null;
      updates.foto_url = cleanBanner || null;
    }

    if (shouldClaimOwnership && claimEmail) {
      updates.email_propietario = claimEmail;
      updates.nombre_propietario = claimName;
      if (place.prioridad === 3) {
        updates.prioridad = 2; // Elevar a verificado
      }
    }

    // Guardar permanentemente en base de datos PostgreSQL o archivo JSON
    const updatedPlace = await updateLugar(id_slug, updates);

    return NextResponse.json({
      ok: true,
      mensaje: '¡Ubicación satelital reubicada y guardada exitosamente!',
      lugar: updatedPlace,
      autor: authorLabel,
    });
  } catch (error: any) {
    console.error('Error en POST /api/owner/reubicar:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al reubicar el lugar' },
      { status: 500 }
    );
  }
}
