import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { sendEmail } from '@/lib/services/mailing';
import { PrismaClient } from '@/lib/generated/prisma';
import { createAuditLog } from '@/lib/services/auditLog';
import { createSecureResponse } from '@/lib/security/headers';
import { userRegistrationSchema } from '@/lib/security/validation';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      studentId,
      department,
      yearOfStudy,
      phone
    } = await request.json();

    // Validate input using schema
    const validationResult = userRegistrationSchema.safeParse({
      email,
      password,
      firstName,
      lastName,
      role,
      studentId,
      department,
      yearOfStudy,
      phone
    });

    if (!validationResult.success) {
      return createSecureResponse(
        { error: 'Validation failed', details: validationResult.error.issues },
        400
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      return createSecureResponse(
        { error: 'User with this email already exists' },
        409
      );
    }

    // Hash password with configurable salt rounds
    const saltRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: role,
        student_id: studentId || null,
        department: department || null,
        year_of_study: yearOfStudy || null,
        phone: phone || null,
      },
    });

    // Send welcome email
    await sendEmail(
      email.toLowerCase(),
      'Welcome to the Experiential Learning Portal',
      `<h1>Welcome, ${firstName} ${lastName}!</h1><p>Thank you for registering with our portal.</p>`
    );

    await createAuditLog(
        newUser.id,
        'REGISTER',
        'users',
        newUser.id
    );

    return createSecureResponse({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return createSecureResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
