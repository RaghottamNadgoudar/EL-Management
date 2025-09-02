import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createSecureResponse } from '@/lib/security/headers';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return createSecureResponse(
        { error: 'No authentication token' },
        401
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    if (!decoded.user) {
      return createSecureResponse(
        { error: 'Invalid token' },
        401
      );
    }

    return createSecureResponse({
      user: decoded.user
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return createSecureResponse(
      { error: 'Invalid token' },
      401
    );
  }
}
