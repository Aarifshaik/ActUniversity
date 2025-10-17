-- Add IST Columns to All Tables
-- This migration adds IST timestamp columns to all tables while preserving UTC data
-- Copy and paste this ENTIRE content into Supabase SQL Editor

-- ========================================
-- ADD IST COLUMNS TO ALL TABLES
-- ========================================

-- 1. EMPLOYEES TABLE
ALTER TABLE employees 
ADD COLUMN last_login_at_ist timestamp 
GENERATED ALWAYS AS (last_login_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE employees 
ADD COLUMN created_at_ist timestamp 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE employees 
ADD COLUMN updated_at_ist timestamp 
GENERATED ALWAYS AS (updated_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 2. COURSES TABLE
ALTER TABLE courses 
ADD COLUMN created_at_ist timestamp 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE courses 
ADD COLUMN updated_at_ist timestamp 
GENERATED ALWAYS AS (updated_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 3. ACTIVITIES TABLE
ALTER TABLE activities 
ADD COLUMN created_at_ist timestamp 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE activities 
ADD COLUMN updated_at_ist timestamp 
GENERATED ALWAYS AS (updated_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 4. EMPLOYEE_PROGRESS TABLE
ALTER TABLE employee_progress 
ADD COLUMN started_at_ist timestamp 
GENERATED ALWAYS AS (started_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE employee_progress 
ADD COLUMN completed_at_ist timestamp 
GENERATED ALWAYS AS (completed_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE employee_progress 
ADD COLUMN last_accessed_at_ist timestamp 
GENERATED ALWAYS AS (last_accessed_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE employee_progress 
ADD COLUMN created_at_ist timestamp 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE employee_progress 
ADD COLUMN updated_at_ist timestamp 
GENERATED ALWAYS AS (updated_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 5. SESSIONS TABLE
ALTER TABLE sessions 
ADD COLUMN last_activity_at_ist timestamp 
GENERATED ALWAYS AS (last_activity_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE sessions 
ADD COLUMN expires_at_ist timestamp 
GENERATED ALWAYS AS (expires_at AT TIME ZONE 'Asia/Kolkata') STORED;

ALTER TABLE sessions 
ADD COLUMN created_at_ist timestamp 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 6. AUDIT_LOGS TABLE
ALTER TABLE audit_logs 
ADD COLUMN created_at_ist timestamp 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 7. CONTENT_ACCESS_LOGS TABLE
ALTER TABLE content_access_logs 
ADD COLUMN accessed_at_ist timestamp 
GENERATED ALWAYS AS (accessed_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 8. QUIZ_QUESTIONS TABLE
ALTER TABLE quiz_questions 
ADD COLUMN created_at_ist timestamp 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 9. QUIZ_ATTEMPTS TABLE
ALTER TABLE quiz_attempts 
ADD COLUMN submitted_at_ist timestamp 
GENERATED ALWAYS AS (submitted_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 10. DECLARATIONS TABLE
ALTER TABLE declarations 
ADD COLUMN created_at_ist timestamp 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- 11. EMPLOYEE_DECLARATIONS TABLE
ALTER TABLE employee_declarations 
ADD COLUMN signed_at_ist timestamp 
GENERATED ALWAYS AS (signed_at AT TIME ZONE 'Asia/Kolkata') STORED;

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE (OPTIONAL)
-- ========================================

-- Index on most frequently queried IST columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_ist ON audit_logs (created_at_ist);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity_ist ON sessions (last_activity_at_ist);
CREATE INDEX IF NOT EXISTS idx_employees_last_login_ist ON employees (last_login_at_ist);

-- ========================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON COLUMN employees.last_login_at_ist IS 'Last login timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN employees.created_at_ist IS 'Account creation timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN employees.updated_at_ist IS 'Last update timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN courses.created_at_ist IS 'Course creation timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN courses.updated_at_ist IS 'Course update timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN activities.created_at_ist IS 'Activity creation timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN activities.updated_at_ist IS 'Activity update timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN employee_progress.started_at_ist IS 'Progress start timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN employee_progress.completed_at_ist IS 'Progress completion timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN employee_progress.last_accessed_at_ist IS 'Last access timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN employee_progress.created_at_ist IS 'Progress record creation timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN employee_progress.updated_at_ist IS 'Progress record update timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN sessions.last_activity_at_ist IS 'Last activity timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN sessions.expires_at_ist IS 'Session expiry timestamp in IST (Asia/Kolkata) - auto-generated from UTC';
COMMENT ON COLUMN sessions.created_at_ist IS 'Session creation timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN audit_logs.created_at_ist IS 'Audit log timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN content_access_logs.accessed_at_ist IS 'Content access timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN quiz_questions.created_at_ist IS 'Question creation timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN quiz_attempts.submitted_at_ist IS 'Quiz submission timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN declarations.created_at_ist IS 'Declaration creation timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

COMMENT ON COLUMN employee_declarations.signed_at_ist IS 'Declaration signing timestamp in IST (Asia/Kolkata) - auto-generated from UTC';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Test the IST columns are working
SELECT 'IST Columns Added Successfully!' as status;

-- Show sample data with both UTC and IST timestamps
SELECT 
  'audit_logs' as table_name,
  COUNT(*) as total_records,
  MIN(created_at) as earliest_utc,
  MIN(created_at_ist) as earliest_ist,
  MAX(created_at) as latest_utc,
  MAX(created_at_ist) as latest_ist
FROM audit_logs
WHERE created_at IS NOT NULL

UNION ALL

SELECT 
  'sessions' as table_name,
  COUNT(*) as total_records,
  MIN(created_at) as earliest_utc,
  MIN(created_at_ist) as earliest_ist,
  MAX(created_at) as latest_utc,
  MAX(created_at_ist) as latest_ist
FROM sessions
WHERE created_at IS NOT NULL

UNION ALL

SELECT 
  'employees' as table_name,
  COUNT(*) as total_records,
  MIN(created_at) as earliest_utc,
  MIN(created_at_ist) as earliest_ist,
  MAX(created_at) as latest_utc,
  MAX(created_at_ist) as latest_ist
FROM employees
WHERE created_at IS NOT NULL;

-- Show IST format examples
SELECT 
  'Current Time Comparison' as info,
  now() as current_utc,
  (now() AT TIME ZONE 'Asia/Kolkata') as current_ist;