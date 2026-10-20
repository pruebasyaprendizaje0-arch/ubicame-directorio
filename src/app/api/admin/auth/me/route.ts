import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      role: session.role,
    },
  });
}
