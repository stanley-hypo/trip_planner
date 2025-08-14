import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;
    
    const correctPassword = process.env.APP_PASSWORD;
    
    if (!correctPassword) {
      return NextResponse.json({ ok: false, error: 'Password not configured' }, { status: 500 });
    }
    
    if (password === correctPassword) {
      // Create a simple session token (in production, use proper JWT)
      const sessionToken = Buffer.from(`authenticated:${Date.now()}`).toString('base64');
      
      const response = NextResponse.json({ ok: true, message: 'Authentication successful' });
      
      // Set secure cookie
      response.cookies.set('auth-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });
      
      return response;
    } else {
      return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json({ ok: false, authenticated: false });
    }
    
    // Simple token validation (in production, use proper JWT verification)
    try {
      const decoded = Buffer.from(authToken.value, 'base64').toString();
      if (decoded.startsWith('authenticated:')) {
        const timestamp = parseInt(decoded.split(':')[1]);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (now - timestamp < oneDay) {
          return NextResponse.json({ ok: true, authenticated: true });
        }
      }
    } catch (e) {
      // Invalid token
    }
    
    return NextResponse.json({ ok: false, authenticated: false });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true, message: 'Logged out' });
  response.cookies.delete('auth-token');
  return response;
}
