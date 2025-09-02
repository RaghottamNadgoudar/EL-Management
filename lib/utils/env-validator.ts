import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_ENABLED: z.string().transform(val => val === 'true').default('true'),
  SMTP_ENABLED: z.string().transform(val => val === 'true').default('false'),
  PLAGIARISM_ENABLED: z.string().transform(val => val === 'true').default('true'),
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('true'),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    }
    return null;
  }
}

// Check for missing critical environment variables
export function checkCriticalEnvVars(): string[] {
  const missing: string[] = [];
  
  const critical = [
    'NEXTAUTH_SECRET',
    'DATABASE_URL'
  ];
  
  critical.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });
  
  return missing;
}
