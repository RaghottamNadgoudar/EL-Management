import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database/connection';
import { PlagiarismChecker } from '@/lib/services/plagiarism';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      registrationId,
      phaseNumber,
      submissionData
    } = await request.json();

    // Check if user owns this registration
    const registrationCheck = await prisma.$queryRaw<any[]>`
      SELECT id FROM project_registrations WHERE id = ${registrationId} AND student_id = ${user.id}
    `;

    if (registrationCheck.length === 0) {
      return NextResponse.json({ error: 'Invalid registration' }, { status: 403 });
    }

    // Create submission
    const submissionInsert = await prisma.$queryRaw<any[]>`
      INSERT INTO project_submissions (registration_id, phase_number, submission_data, status)
      VALUES (${registrationId}, ${phaseNumber}, ${JSON.stringify(submissionData)}, 'submitted')
      RETURNING *
    `;

    const submission = submissionInsert[0];

    // Start plagiarism check in background
    if (submissionData.abstract || submissionData.description) {
      const textToCheck = (submissionData.abstract || '') + ' ' + (submissionData.description || '');
      const plagiarismChecker = new PlagiarismChecker();
      
      // Run plagiarism check asynchronously
      plagiarismChecker.performFullCheck(textToCheck, submission.id)
        .then(async (plagiarismResult) => {
          await prisma.$executeRaw`
            INSERT INTO plagiarism_checks (submission_id, check_type, similarity_percentage, matched_sources, status)
            VALUES (${submission.id}, 'comprehensive', ${plagiarismResult.overallSimilarity}, ${JSON.stringify(plagiarismResult.results)}, 'completed')
          `;
        })
        .catch(error => console.error('Plagiarism check failed:', error));
    }

    return NextResponse.json({
      message: 'Submission created successfully',
      submission
    });
  } catch (error) {
    console.error('Submission creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const phaseNumber = searchParams.get('phase');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (user.role === 'student') {
      whereClause += ' AND pr.student_id = $' + (params.length + 1);
      params.push(user.id);
    }

    if (eventId) {
      whereClause += ' AND pr.event_id = $' + (params.length + 1);
      params.push(eventId);
    }

    if (phaseNumber) {
      whereClause += ' AND ps.phase_number = $' + (params.length + 1);
      params.push(parseInt(phaseNumber));
    }

    const submissions = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        ps.*,
        pr.project_title,
        pr.student_id,
        u.first_name || ' ' || u.last_name as student_name,
        e.name as event_name,
        ep.name as phase_name
      FROM project_submissions ps
      JOIN project_registrations pr ON ps.registration_id = pr.id
      JOIN users u ON pr.student_id = u.id
      JOIN events e ON pr.event_id = e.id
      JOIN event_phases ep ON e.id = ep.event_id AND ps.phase_number = ep.phase_number
      ${whereClause}
      ORDER BY ps.created_at DESC
    `, ...params);

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}