-- Experiential Learning Management System Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for authentication and profile management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'evaluator', 'admin', 'super_admin')) NOT NULL,
    student_id VARCHAR(20) UNIQUE, -- For students
    department VARCHAR(100),
    year_of_study INTEGER, -- For students (1-4)
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table for managing EL events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    academic_year VARCHAR(20) NOT NULL, -- e.g., "2024-25"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    registration_deadline DATE,
    created_by UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}', -- Store customizable settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event phases configuration
CREATE TABLE IF NOT EXISTS event_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    requirements JSONB DEFAULT '[]', -- Array of requirements
    allowed_file_types JSONB DEFAULT '[]', -- Array of file extensions
    max_files INTEGER DEFAULT 5,
    deadline_days INTEGER NOT NULL, -- Days from event start
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, phase_number)
);

-- Student project registrations
CREATE TABLE IF NOT EXISTS project_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_members JSONB DEFAULT '[]', -- Array of team member details
    project_title VARCHAR(300) NOT NULL,
    project_description TEXT,
    current_phase INTEGER DEFAULT 1,
    status VARCHAR(20) CHECK (status IN ('registered', 'phase1_pending', 'phase1_approved', 'phase1_rejected', 'phase2_pending', 'phase2_approved', 'phase2_rejected', 'phase3_pending', 'phase3_approved', 'phase3_rejected', 'completed')) DEFAULT 'registered',
    final_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, student_id)
);

-- Project submissions for each phase
CREATE TABLE IF NOT EXISTS project_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID REFERENCES project_registrations(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    submission_data JSONB DEFAULT '{}', -- Store form data
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'revision_required')) DEFAULT 'submitted',
    evaluator_feedback TEXT,
    score DECIMAL(5,2),
    evaluated_at TIMESTAMP WITH TIME ZONE,
    evaluated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File uploads for submissions
CREATE TABLE IF NOT EXISTS submission_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plagiarism check results
CREATE TABLE IF NOT EXISTS plagiarism_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
    file_id UUID REFERENCES submission_files(id) ON DELETE CASCADE,
    check_type VARCHAR(20) CHECK (check_type IN ('google', 'youtube', 'academic', 'internal')) NOT NULL,
    similarity_percentage DECIMAL(5,2) NOT NULL,
    matched_sources JSONB DEFAULT '[]', -- Array of matched URLs/sources
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluation criteria for each phase
CREATE TABLE IF NOT EXISTS evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    criteria_name VARCHAR(200) NOT NULL,
    criteria_description TEXT,
    max_score INTEGER DEFAULT 25,
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed evaluation scores
CREATE TABLE IF NOT EXISTS evaluation_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES project_submissions(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification system
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50), -- 'submission', 'event', etc.
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_events_academic_year ON events(academic_year);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_project_registrations_event ON project_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_project_registrations_student ON project_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_project_registrations_status ON project_registrations(status);
CREATE INDEX IF NOT EXISTS idx_project_submissions_registration ON project_submissions(registration_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_phase ON project_submissions(phase_number);
CREATE INDEX IF NOT EXISTS idx_project_submissions_status ON project_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submission_files_submission ON submission_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_checks_submission ON plagiarism_checks(submission_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES ('admin@college.edu', '$2b$10$rOKuN8XwZwZwYWWXvfxziu9V9n9/9HgqhZa3d3/4vZyVcZnZcZnZc', 'System', 'Administrator', 'super_admin', true, true)
ON CONFLICT (email) DO NOTHING;

-- Sample evaluation criteria templates
INSERT INTO evaluation_criteria (event_id, phase_number, criteria_name, criteria_description, max_score)
SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID, -- Template event
    1, 
    criterion,
    'Default ' || criterion || ' evaluation criteria',
    25
FROM (VALUES 
    ('Innovation & Creativity'),
    ('Technical Feasibility'), 
    ('Problem Statement Clarity'),
    ('Presentation Quality')
) AS criteria(criterion)
ON CONFLICT DO NOTHING;