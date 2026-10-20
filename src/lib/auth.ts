import crypto from 'crypto';

export const ADMIN_CREDENTIALS = {
  email: (process.env.ADMIN_EMAIL || 'pruebasyaprendizaje0@gmail.com').toLowerCase().trim(),
  password: process.env.ADMIN_PASSWORD || 'Frhc1971*',
};

const SECRET_KEY = process.env.JWT_SECRET || 'ubicame-directorio-superadmin-secret-key-2026';

export interface SessionData {
  email: string;
  role: 'superadmin';
  exp: number; // Unix timestamp in ms
}

/**
 * Valida credenciales contra el Super Admin autorizado
 */
export function validateAdminCredentials(email?: string, password?: string): boolean {
  if (!email || !password) return false;
  const cleanEmail = email.toLowerCase().trim();
  return cleanEmail === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}

/**
 * Crea un token de sesión firmado para la cookie HTTP-only
 */
export function createSessionToken(email: string): string {
  const payload: SessionData = {
    email: email.toLowerCase().trim(),
    role: 'superadmin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días de validez
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Verifica si el token es válido y no ha expirado
 */
export function verifySessionToken(token?: string): SessionData | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;

  // Verificar firma HMAC
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadStr)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload: SessionData = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf-8')
    );

    // Verificar expiración
    if (Date.now() > payload.exp) {
      return null;
    }

    // Verificar que coincida con el email de superadmin
    if (payload.email !== ADMIN_CREDENTIALS.email) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
