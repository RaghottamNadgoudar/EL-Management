import { NextRequest, NextResponse } from 'next/server';
import { createSecureResponse } from '@/lib/security/headers';

export async function POST(request: NextRequest) {
  try {
    const response = createSecureResponse({ message: 'Logged out successfully' });
    
    // Clear the auth token cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return createSecureResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
