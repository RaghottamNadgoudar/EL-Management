import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
    services: {
      database: 'unknown',
      email: 'unknown',
      plagiarism: 'unknown'
    }
  };

  // Check database connection
  try {
    if (process.env.DATABASE_ENABLED === 'true') {
      // Simple ping using Prisma
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.services.database = 'healthy';
    } else {
      healthCheck.services.database = 'disabled';
    }
  } catch (error) {
    healthCheck.services.database = 'unhealthy';
    healthCheck.status = 'degraded';
  }

  // Check email service
  healthCheck.services.email = process.env.SMTP_ENABLED === 'true' ? 'enabled' : 'disabled';

  // Check plagiarism service
  const hasGoogleApi = !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID);
  const hasYouTubeApi = !!process.env.YOUTUBE_API_KEY;
  healthCheck.services.plagiarism = (hasGoogleApi || hasYouTubeApi) ? 'enabled' : 'disabled';

  const statusCode = healthCheck.status === 'ok' ? 200 : 503;
  return NextResponse.json(healthCheck, { status: statusCode });
}
