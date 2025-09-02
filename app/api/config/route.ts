import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { createSecureResponse } from '@/lib/security/headers';
import { checkCriticalEnvVars } from '@/lib/utils/env-validator';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    const missingVars = checkCriticalEnvVars();
    
    const config = {
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0',
      features: {
        database: process.env.DATABASE_ENABLED === 'true',
        email: process.env.SMTP_ENABLED === 'true',
        plagiarism: process.env.PLAGIARISM_ENABLED === 'true',
        rateLimit: process.env.RATE_LIMIT_ENABLED === 'true',
        auditLog: process.env.FEATURE_AUDIT_LOGGING === 'true',
      },
      security: {
        cookieSecure: process.env.COOKIE_SECURE === 'true',
        corsEnabled: !!process.env.CORS_ORIGIN,
        cspEnabled: process.env.CSP_ENABLED === 'true',
        hstsEnabled: process.env.HSTS_ENABLED === 'true',
      },
      missingCriticalVars: missingVars,
      isHealthy: missingVars.length === 0
    };

    return createSecureResponse(config);
  } catch (error) {
    console.error('Config fetch error:', error);
    return createSecureResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
