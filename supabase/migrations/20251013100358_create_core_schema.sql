/*
  # Act University LMS - Core Database Schema

  ## Overview
  Enterprise-grade Learning Management System with comprehensive security, 
  session tracking, and audit logging capabilities.

  ## 1. New Tables

  ### `employees`
  User accounts for all employees with authentication credentials
  - `id` (uuid, primary key) - Internal unique identifier
  - `emp_id` (text, unique) - Employee ID for login (e.g., EMP001)
  - `email` (text, unique) - Employee email address
  - `password_hash` (text) - Bcrypt hashed password
  - `full_name` (text) - Employee's full name
  - `department` (text) - Department/Division
  - `role` (text) - User role: 'employee' or 'admin'
  - `is_active` (boolean) - Account status
  - `last_login_at` (timestamptz) - Last successful login timestamp
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last profile update

  ### `courses`
  Top-level learning courses/programs
  - `id` (uuid, primary key) - Unique course identifier
  - `title` (text) - Course name
  - `description` (text) - Detailed course description
  - `thumbnail_url` (text) - Course thumbnail image URL
  - `category` (text) - Course category/tag
  - `difficulty_level` (text) - beginner/intermediate/advanced
  - `estimated_duration_minutes` (integer) - Total course duration
  - `is_published` (boolean) - Visibility status
  - `display_order` (integer) - Sorting order in UI
  - `created_by` (uuid, fk) - Admin who created the course
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `activities`
  Individual learning activities within courses (PPTs, videos, quizzes, etc.)
  - `id` (uuid, primary key)
  - `course_id` (uuid, fk) - Parent course
  - `title` (text) - Activity name
  - `description` (text) - Brief description (3 lines max in UI)
  - `activity_type` (text) - 'ppt'|'video'|'quiz'|'declaration'|'article'
  - `content_url` (text) - S3/CDN path to content (encrypted reference)
  - `thumbnail_url` (text) - Activity thumbnail
  - `duration_minutes` (integer) - Expected completion time
  - `display_order` (integer) - Order within course
  - `is_mandatory` (boolean) - Required for course completion
  - `passing_score` (integer) - For quizzes (null for other types)
  - `metadata` (jsonb) - Type-specific metadata (slides count, video resolution, etc.)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `employee_progress`
  Tracks individual employee progress through courses and activities
  - `id` (uuid, primary key)
  - `employee_id` (uuid, fk) - Employee
  - `course_id` (uuid, fk) - Course
  - `activity_id` (uuid, fk, nullable) - Specific activity (null = course-level)
  - `status` (text) - 'not_started'|'in_progress'|'completed'|'failed'
  - `progress_percentage` (integer) - 0-100
  - `score` (integer, nullable) - For quizzes/assessments
  - `time_spent_seconds` (integer) - Actual time spent
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz, nullable)
  - `last_accessed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `sessions`
  Active user sessions with security tracking
  - `id` (uuid, primary key)
  - `employee_id` (uuid, fk) - Session owner
  - `session_token` (text, unique) - JWT token identifier
  - `ip_address` (text) - Client IP for security
  - `user_agent` (text) - Browser/device info
  - `last_activity_at` (timestamptz) - For 30-min idle timeout
  - `expires_at` (timestamptz) - Max 8-hour session
  - `is_active` (boolean) - Session validity
  - `logout_reason` (text, nullable) - 'manual'|'timeout'|'admin_forced'|'security'
  - `created_at` (timestamptz)

  ### `audit_logs`
  Comprehensive audit trail for compliance
  - `id` (uuid, primary key)
  - `employee_id` (uuid, fk, nullable) - Actor (null for system events)
  - `session_id` (uuid, fk, nullable) - Related session
  - `event_type` (text) - 'login'|'logout'|'content_view'|'quiz_submit'|'admin_action'
  - `event_category` (text) - 'authentication'|'content'|'security'|'admin'
  - `resource_type` (text, nullable) - 'course'|'activity'|'employee'
  - `resource_id` (uuid, nullable) - Referenced resource
  - `action_details` (jsonb) - Event-specific metadata
  - `ip_address` (text)
  - `user_agent` (text)
  - `severity` (text) - 'info'|'warning'|'critical'
  - `created_at` (timestamptz)

  ### `content_access_logs`
  Forensic tracking for content access (watermarking reference)
  - `id` (uuid, primary key)
  - `employee_id` (uuid, fk)
  - `activity_id` (uuid, fk)
  - `session_id` (uuid, fk)
  - `access_type` (text) - 'stream_start'|'slide_view'|'download_attempt'
  - `signed_url_token` (text) - Reference to issued signed URL
  - `watermark_data` (text) - EMP_ID + timestamp + session_id
  - `accessed_at` (timestamptz)
  - `ip_address` (text)

  ### `quiz_questions`
  Questions for quiz activities
  - `id` (uuid, primary key)
  - `activity_id` (uuid, fk) - Parent quiz activity
  - `question_text` (text)
  - `question_type` (text) - 'multiple_choice'|'true_false'|'multi_select'
  - `options` (jsonb) - Array of answer options
  - `correct_answer` (jsonb) - Correct answer(s)
  - `points` (integer) - Points for correct answer
  - `display_order` (integer)
  - `created_at` (timestamptz)

  ### `quiz_attempts`
  Employee quiz submissions
  - `id` (uuid, primary key)
  - `employee_id` (uuid, fk)
  - `activity_id` (uuid, fk)
  - `session_id` (uuid, fk)
  - `answers` (jsonb) - Submitted answers
  - `score` (integer) - Calculated score
  - `total_possible` (integer) - Maximum score
  - `passed` (boolean) - Whether passing_score met
  - `time_taken_seconds` (integer)
  - `submitted_at` (timestamptz)

  ### `declarations`
  Acknowledgment/compliance declarations
  - `id` (uuid, primary key)
  - `activity_id` (uuid, fk) - Parent declaration activity
  - `declaration_text` (text) - What employee must acknowledge
  - `requires_signature` (boolean)
  - `created_at` (timestamptz)

  ### `employee_declarations`
  Signed declarations by employees
  - `id` (uuid, primary key)
  - `employee_id` (uuid, fk)
  - `declaration_id` (uuid, fk)
  - `activity_id` (uuid, fk)
  - `session_id` (uuid, fk)
  - `agreed` (boolean)
  - `signature_data` (text, nullable) - Digital signature if required
  - `signed_at` (timestamptz)
  - `ip_address` (text)

  ## 2. Security
  - Enable RLS on all tables
  - Employees can only access their own data
  - Admins have elevated privileges
  - Content access requires active session validation
  - Audit logs are append-only

  ## 3. Indexes
  - Performance indexes on foreign keys and frequently queried columns
  - Session lookup optimization
  - Audit log search capabilities

  ## 4. Important Notes
  - All passwords stored as bcrypt hashes (handled in application layer)
  - Sessions enforce 30-minute idle timeout and 8-hour max duration
  - Audit logs provide complete forensic trail
  - Content URLs are encrypted references, not direct paths
  - Watermarking data stored for compliance tracking
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  department text DEFAULT '',
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  thumbnail_url text DEFAULT '',
  category text DEFAULT '',
  difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes integer DEFAULT 0,
  is_published boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  activity_type text NOT NULL CHECK (activity_type IN ('ppt', 'video', 'quiz', 'declaration', 'article')),
  content_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  duration_minutes integer DEFAULT 0,
  display_order integer DEFAULT 0,
  is_mandatory boolean DEFAULT false,
  passing_score integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee_progress table
CREATE TABLE IF NOT EXISTS employee_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  score integer,
  time_spent_seconds integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, course_id, activity_id)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  last_activity_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  logout_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_category text NOT NULL CHECK (event_category IN ('authentication', 'content', 'security', 'admin')),
  resource_type text,
  resource_id uuid,
  action_details jsonb DEFAULT '{}',
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at timestamptz DEFAULT now()
);

-- Create content_access_logs table
CREATE TABLE IF NOT EXISTS content_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  access_type text NOT NULL CHECK (access_type IN ('stream_start', 'slide_view', 'download_attempt')),
  signed_url_token text DEFAULT '',
  watermark_data text NOT NULL,
  accessed_at timestamptz DEFAULT now(),
  ip_address text DEFAULT ''
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'multi_select')),
  options jsonb DEFAULT '[]',
  correct_answer jsonb NOT NULL,
  points integer DEFAULT 1,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '{}',
  score integer DEFAULT 0,
  total_possible integer DEFAULT 0,
  passed boolean DEFAULT false,
  time_taken_seconds integer DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

-- Create declarations table
CREATE TABLE IF NOT EXISTS declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  declaration_text text NOT NULL,
  requires_signature boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create employee_declarations table
CREATE TABLE IF NOT EXISTS employee_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  declaration_id uuid NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  agreed boolean DEFAULT false,
  signature_data text DEFAULT '',
  signed_at timestamptz DEFAULT now(),
  ip_address text DEFAULT ''
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published, display_order);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_course ON activities(course_id, display_order);
CREATE INDEX IF NOT EXISTS idx_progress_employee ON employee_progress(employee_id, course_id);
CREATE INDEX IF NOT EXISTS idx_progress_activity ON employee_progress(activity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_employee ON sessions(employee_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_employee ON audit_logs(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_category ON audit_logs(event_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_access ON content_access_logs(employee_id, activity_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_questions ON quiz_questions(activity_id, display_order);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts ON quiz_attempts(employee_id, activity_id, submitted_at DESC);

-- Enable Row Level Security on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_declarations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees table
CREATE POLICY "Employees can view own profile"
  ON employees FOR SELECT
  TO authenticated
  USING (id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

CREATE POLICY "Employees can update own profile"
  ON employees FOR UPDATE
  TO authenticated
  USING (id = (current_setting('app.current_employee_id', true))::uuid)
  WITH CHECK (id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Admins can manage all employees"
  ON employees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for courses table
CREATE POLICY "Employees can view published courses"
  ON courses FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage all courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for activities table
CREATE POLICY "Employees can view activities of published courses"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = activities.course_id
      AND c.is_published = true
    )
  );

CREATE POLICY "Admins can manage all activities"
  ON activities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for employee_progress table
CREATE POLICY "Employees can view own progress"
  ON employee_progress FOR SELECT
  TO authenticated
  USING (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Employees can update own progress"
  ON employee_progress FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Employees can modify own progress"
  ON employee_progress FOR UPDATE
  TO authenticated
  USING (employee_id = (current_setting('app.current_employee_id', true))::uuid)
  WITH CHECK (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Admins can view all progress"
  ON employee_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for sessions table
CREATE POLICY "Employees can view own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Employees can create own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Employees can update own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (employee_id = (current_setting('app.current_employee_id', true))::uuid)
  WITH CHECK (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Admins can manage all sessions"
  ON sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for audit_logs (append-only for employees, full access for admins)
CREATE POLICY "Employees can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for content_access_logs
CREATE POLICY "Employees can view own content access"
  ON content_access_logs FOR SELECT
  TO authenticated
  USING (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "System can insert content access logs"
  ON content_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Admins can view all content access logs"
  ON content_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for quiz_questions
CREATE POLICY "Employees can view quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = quiz_questions.activity_id
      AND c.is_published = true
    )
  );

CREATE POLICY "Admins can manage quiz questions"
  ON quiz_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for quiz_attempts
CREATE POLICY "Employees can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Employees can submit quiz attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Admins can view all quiz attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for declarations
CREATE POLICY "Employees can view declarations"
  ON declarations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = declarations.activity_id
      AND c.is_published = true
    )
  );

CREATE POLICY "Admins can manage declarations"
  ON declarations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );

-- RLS Policies for employee_declarations
CREATE POLICY "Employees can view own declarations"
  ON employee_declarations FOR SELECT
  TO authenticated
  USING (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Employees can sign declarations"
  ON employee_declarations FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Admins can view all employee declarations"
  ON employee_declarations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = (current_setting('app.current_employee_id', true))::uuid
      AND e.role = 'admin'
    )
  );