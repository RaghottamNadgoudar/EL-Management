import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { PrismaClient } from '@/lib/generated/prisma';
import { createSecureResponse } from '@/lib/security/headers';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    if (process.env.DATABASE_ENABLED !== 'true') {
      return createSecureResponse({ message: 'Database is disabled' }, 503);
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    let events;
    if (search) {
      events = await prisma.event.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            },
            {
              is_active: true,
            },
          ],
        },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
          project_registrations: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } else {
      events = await prisma.event.findMany({
        where: {
          is_active: true,
        },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
          project_registrations: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    }

    const eventsWithCreatedByName = events.map((event) => ({
      ...event,
      created_by_name: `${event.user?.first_name} ${event.user?.last_name}`,
      total_registrations: event.project_registrations.length,
    }));

    return createSecureResponse({ events: eventsWithCreatedByName });
  } catch (error) {
    console.error('Events fetch error:', error);
    return createSecureResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    if (process.env.DATABASE_ENABLED !== 'true') {
      return createSecureResponse({ message: 'Database is disabled' }, 503);
    }

    const {
      name,
      description,
      academicYear,
      startDate,
      endDate,
      registrationDeadline,
      phases
    } = await request.json();

    // Create event
    const event = await prisma.event.create({
      data: {
        name,
        description,
        academic_year: academicYear,
        start_date: startDate,
        end_date: endDate,
        registration_deadline: registrationDeadline,
        created_by: user.id,
      },
    });

    // Create phases
    for (const phase of phases) {
      await prisma.eventPhase.create({
        data: {
          event_id: event.id,
          phase_number: phase.number,
          name: phase.name,
          description: phase.description,
          requirements: JSON.stringify(phase.requirements),
          allowed_file_types: JSON.stringify(phase.allowedFileTypes),
          max_files: phase.maxFiles,
          deadline_days: phase.deadlineDays,
        },
      });
    }

    return createSecureResponse({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Event creation error:', error);
    return createSecureResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
