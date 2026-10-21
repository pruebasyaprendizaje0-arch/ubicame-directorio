import { NextRequest, NextResponse } from 'next/server';
import { getLugarBySlug, updateLugar } from '@/services/placesService';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

function cleanPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_slug, latitud, longitud, google_user, claim_whatsapp, admin_password } = body;

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

    // 2. Verificar autorización flexible y sin bloqueos
    const adminToken = request.cookies.get('admin_session')?.value;
    const adminSession = verifySessionToken(adminToken);
    const isSuperAdminCookie = Boolean(adminSession);
    const isSuperAdminPass = admin_password && admin_password === (process.env.ADMIN_PASSWORD || 'Frhc1971*');
    const isSuperAdmin = isSuperAdminCookie || isSuperAdminPass;

    let isAuthorized = false;
    let shouldClaimOwnership = false;
    let claimEmail = '';
    let claimName = '';

    const userEmail = google_user?.email?.toLowerCase().trim();
    const userName = google_user?.name?.trim() || 'Propietario Verificado';

    // A. Si es Super Admin -> Autorizado de inmediato
    if (isSuperAdmin) {
      isAuthorized = true;
    }
    // B. Si está en entorno local o de desarrollo -> Autorizado de inmediato (para pruebas fluidas)
    else if (process.env.NODE_ENV !== 'production' || process.env.USE_LOCAL_DATA === 'true' || !process.env.DATABASE_URL) {
      isAuthorized = true;
      if (userEmail) {
        shouldClaimOwnership = true;
        claimEmail = userEmail;
        claimName = userName;
      }
    }
    // C. Si envió cuenta de Google
    else if (userEmail) {
      const placeOwnerEmail = (place.email_propietario || '').toLowerCase().trim();
      const descOwnerMatch = place.descripcion?.toLowerCase().includes(userEmail);

      if (placeOwnerEmail && (placeOwnerEmail === userEmail || descOwnerMatch)) {
        isAuthorized = true;
      } else if (!placeOwnerEmail && descOwnerMatch) {
        isAuthorized = true;
      } else if (placeOwnerEmail && placeOwnerEmail !== userEmail) {
        return NextResponse.json(
          {
            ok: false,
            error: `Este negocio ya está vinculado al propietario ${placeOwnerEmail}. Solo ese propietario o el Super Administrador pueden reubicar su icono.`,
          },
          { status: 403 }
        );
      } else {
        // El negocio no tenía dueño registrado -> vinculamos a este usuario de Google
        isAuthorized = true;
        shouldClaimOwnership = true;
        claimEmail = userEmail;
        claimName = userName;
      }
    }
    // D. Si envió WhatsApp que coincide con el teléfono registrado del local
    else if (claim_whatsapp) {
      const registeredPhone = cleanPhone(place.whatsapp);
      const providedPhone = cleanPhone(claim_whatsapp);
      if (
        registeredPhone &&
        providedPhone.length >= 7 &&
        (registeredPhone.endsWith(providedPhone.slice(-7)) || providedPhone.endsWith(registeredPhone.slice(-7)))
      ) {
        isAuthorized = true;
        shouldClaimOwnership = true;
        claimEmail = `whatsapp:${providedPhone}`;
        claimName = place.nombre;
      } else {
        isAuthorized = true; // Permitir actualización comunitaria
      }
    }
    // E. Si el negocio no tiene propietario exclusivo asignado -> Permitir reubicación comunitaria
    else if (!place.email_propietario) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No se pudo verificar la autorización para reubicar este negocio. Conéctate con Google o ingresa el WhatsApp registrado.',
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

    if (shouldClaimOwnership && claimEmail) {
      updates.email_propietario = claimEmail;
      updates.nombre_propietario = claimName;
      if (place.prioridad === 3) {
        updates.prioridad = 2; // Elevar a verificado
      }
    }

    // Guardar permanentemente en base de datos o archivo JSON
    const updatedPlace = await updateLugar(id_slug, updates);

    return NextResponse.json({
      ok: true,
      mensaje: '¡Ubicación satelital reubicada y guardada exitosamente!',
      lugar: updatedPlace,
      autor: isSuperAdmin ? 'Super Administrador' : userEmail ? `Dueño (${userEmail})` : 'Reubicación Satelital Directa',
    });
  } catch (error: any) {
    console.error('Error en POST /api/owner/reubicar:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Error al reubicar el lugar' },
      { status: 500 }
    );
  }
}
