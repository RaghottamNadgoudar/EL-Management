import { z } from 'zod';

// Password validation schema
export const passwordSchema = z.string()
  .min(parseInt(process.env.PASSWORD_MIN_LENGTH || '8'), 'Password must be at least 8 characters')
  .refine((password) => {
    if (process.env.PASSWORD_REQUIRE_UPPERCASE === 'true' && !/[A-Z]/.test(password)) {
      return false;
    }
    if (process.env.PASSWORD_REQUIRE_LOWERCASE === 'true' && !/[a-z]/.test(password)) {
      return false;
    }
    if (process.env.PASSWORD_REQUIRE_NUMBERS === 'true' && !/\d/.test(password)) {
      return false;
    }
    if (process.env.PASSWORD_REQUIRE_SYMBOLS === 'true' && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }
    return true;
  }, 'Password must meet complexity requirements');

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// User registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['student', 'evaluator', 'admin', 'super_admin']),
  studentId: z.string().optional(),
  department: z.string().optional(),
  yearOfStudy: z.number().int().min(1).max(4).optional(),
  phone: z.string().optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1),
  size: z.number().max(parseFileSize(process.env.UPLOAD_MAX_SIZE || '50MB')),
  mimetype: z.string().refine((type) => {
    const allowedTypes = process.env.ALLOWED_MIME_TYPES?.split(',') || [];
    return allowedTypes.includes(type);
  }, 'File type not allowed'),
});

// Helper function to parse file size
function parseFileSize(sizeStr: string): number {
  const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match) return 50 * 1024 * 1024; // Default 50MB
  const [, size, unit] = match;
  return parseFloat(size) * units[unit.toUpperCase() as keyof typeof units];
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .substring(0, 1000); // Limit length
}

// SQL injection prevention
export function validateSqlInput(input: string): boolean {
  const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/i;
  return !sqlKeywords.test(input);
}
