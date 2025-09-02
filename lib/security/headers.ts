import { NextResponse } from 'next/server';

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  if (process.env.CSP_ENABLED === 'true') {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.googleapis.com https://www.googleapis.com",
      "frame-ancestors 'none'",
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);
  }

  // HSTS (HTTP Strict Transport Security)
  if (process.env.HSTS_ENABLED === 'true' && process.env.NODE_ENV === 'production') {
    const maxAge = process.env.HSTS_MAX_AGE || '31536000';
    response.headers.set('Strict-Transport-Security', `max-age=${maxAge}; includeSubDomains; preload`);
  }

  // X-Frame-Options
  response.headers.set('X-Frame-Options', process.env.X_FRAME_OPTIONS || 'DENY');

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', process.env.X_CONTENT_TYPE_OPTIONS || 'nosniff');

  // Referrer Policy
  response.headers.set('Referrer-Policy', process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin');

  // X-XSS-Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Permissions Policy
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  return response;
}

export function createSecureResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  return addSecurityHeaders(response);
}
