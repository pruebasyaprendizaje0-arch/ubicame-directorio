import { NextRequest, NextResponse } from 'next/server';
import { validateAdminCredentials, createSessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Debe ingresar correo y contraseña' },
        { status: 400 }
      );
    }

    const isValid = validateAdminCredentials(email, password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas. Acceso restringido al Super Administrador.' },
        { status: 401 }
      );
    }

    const token = createSessionToken(email);

    const response = NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
      user: {
        email: email.toLowerCase().trim(),
        role: 'superadmin',
      },
    });

    // Guardar cookie HTTP-only segura
    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 días
    });

    return response;
  } catch (error: any) {
    console.error('Error en login admin:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno en el servidor de autenticación' },
      { status: 500 }
    );
  }
}
