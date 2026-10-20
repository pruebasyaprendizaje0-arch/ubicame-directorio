import { NextRequest, NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'ubicame-directorio-superadmin-secret-key-2026';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'pruebasyaprendizaje0@gmail.com').toLowerCase().trim();

/**
 * Verificación universal de token en Middleware (Edge / Node compatible via Web Crypto)
 */
async function verifySession(token?: string): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadStr, signature] = parts;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convertir base64url a Uint8Array
    const base64Sig = signature.replace(/-/g, '+').replace(/_/g, '/');
    const paddedSig = base64Sig.padEnd(base64Sig.length + ((4 - (base64Sig.length % 4)) % 4), '=');
    const sigBytes = Uint8Array.from(atob(paddedSig), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(payloadStr)
    );

    if (!isValid) return false;

    // Decodificar payload
    const base64Payload = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = base64Payload.padEnd(base64Payload.length + ((4 - (base64Payload.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(paddedPayload));

    if (Date.now() > payload.exp) return false;
    if (payload.email !== ADMIN_EMAIL) return false;

    return true;
  } catch (err) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir la página de login y endpoints de autenticación
  if (pathname === '/admin/login' || pathname.startsWith('/api/admin/auth/')) {
    // Si ya está autenticado e intenta ir a /admin/login, redirigir directo a /admin/lugares
    if (pathname === '/admin/login') {
      const token = request.cookies.get('admin_session')?.value;
      const isAuthed = await verifySession(token);
      if (isAuthed) {
        return NextResponse.redirect(new URL('/admin/lugares', request.url));
      }
    }
    return NextResponse.next();
  }

  // Proteger rutas de páginas /admin/*
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_session')?.value;
    const isAuthed = await verifySession(token);

    if (!isAuthed) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Proteger rutas de API /api/admin/*
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('admin_session')?.value;
    const isAuthed = await verifySession(token);

    if (!isAuthed) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Acceso restringido al Super Administrador.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
