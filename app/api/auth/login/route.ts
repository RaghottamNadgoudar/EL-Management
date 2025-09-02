import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/database/connection';
import { loginRateLimiter } from '@/lib/security/rate-limiter';
import { createSecureResponse } from '@/lib/security/headers';
import { emailSchema } from '@/lib/security/validation';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return createSecureResponse(
        { error: 'Email and password are required' },
        400
      );
    }

    // Validate email format
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      return createSecureResponse(
        { error: 'Invalid email format' },
        400
      );
    }

    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limit check
    const rateLimitResult = loginRateLimiter.check(ip);
    if (!rateLimitResult.allowed) {
      return createSecureResponse(
        { error: 'Too many login attempts. Please try again later.' },
        429
      );
    }

    // Get user from database
    const result = await query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return createSecureResponse(
        { error: 'Invalid credentials' },
        401
      );
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return createSecureResponse(
        { error: 'Account is deactivated' },
        401
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return createSecureResponse(
        { error: 'Invalid credentials' },
        401
      );
    }

    // Reset rate limit on successful login
    loginRateLimiter.reset(ip);

    // Create JWT token
    const token = jwt.sign(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
        }
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '7d' }
    );

    // Set cookie and return user data
    const response = createSecureResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
      maxAge: parseInt(process.env.SESSION_TIMEOUT || '604800') // 7 days default
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}