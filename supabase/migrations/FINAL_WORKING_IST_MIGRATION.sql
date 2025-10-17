-- IST Timezone Support for Supabase
-- Copy and paste this ENTIRE content into Supabase SQL Editor

-- Create a function to convert UTC timestamps to IST
CREATE OR REPLACE FUNCTION to_ist(timestamp_utc timestamptz)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_char(timestamp_utc AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI:SS AM') || ' IST';
$$;

-- Create a function to get current IST timestamp
CREATE OR REPLACE FUNCTION now_ist()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT to_char(now() AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI:SS AM') || ' IST';
$$;

-- Create a function to format timestamp for audit logs in IST
CREATE OR REPLACE FUNCTION format_audit_timestamp(timestamp_utc timestamptz)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_char(timestamp_utc AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST';
$$;

-- Create a view for audit logs with IST timestamps
CREATE OR REPLACE VIEW audit_logs_ist AS
SELECT 
  id,
  employee_id,
  session_id,
  event_type,
  event_category,
  resource_type,
  resource_id,
  action_details,
  ip_address,
  user_agent,
  severity,
  created_at,
  format_audit_timestamp(created_at) as created_at_ist,
  to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI:SS') || ' IST' as created_at_ist_csv
FROM audit_logs;

-- Create a view for sessions with IST timestamps
CREATE OR REPLACE VIEW sessions_ist AS
SELECT 
  id,
  employee_id,
  session_token,
  ip_address,
  user_agent,
  last_activity_at,
  to_char(last_activity_at AT TIME ZONE 'Asia/Kolkata', 'HH12:MI:SS AM') as last_activity_at_ist,
  expires_at,
  to_char(expires_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST' as expires_at_ist,
  is_active,
  logout_reason,
  created_at,
  to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST' as created_at_ist
FROM sessions;

-- Create a view for employees with IST timestamps
CREATE OR REPLACE VIEW employees_ist AS
SELECT 
  id,
  emp_id,
  email,
  password_hash,
  full_name,
  department,
  role,
  is_active,
  last_login_at,
  CASE 
    WHEN last_login_at IS NOT NULL 
    THEN to_char(last_login_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY')
    ELSE NULL 
  END as last_login_at_ist,
  created_at,
  to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST' as created_at_ist,
  updated_at,
  to_char(updated_at AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST' as updated_at_ist
FROM employees;

-- Create simple index on base column (FIXED - no more syntax error)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

-- Grant permissions for the views
GRANT SELECT ON audit_logs_ist TO authenticated;
GRANT SELECT ON sessions_ist TO authenticated;
GRANT SELECT ON employees_ist TO authenticated;

-- Add RLS policies for the views (inherit from base tables)
ALTER VIEW audit_logs_ist SET (security_invoker = true);
ALTER VIEW sessions_ist SET (security_invoker = true);
ALTER VIEW employees_ist SET (security_invoker = true);

-- Add comments explaining the timezone setup
COMMENT ON FUNCTION to_ist(timestamptz) IS 'Converts UTC timestamp to IST format: DD Mon YYYY, HH12:MI:SS AM IST';
COMMENT ON FUNCTION now_ist() IS 'Returns current timestamp in IST format';
COMMENT ON FUNCTION format_audit_timestamp(timestamptz) IS 'Formats timestamp for audit log display in IST';
COMMENT ON VIEW audit_logs_ist IS 'Audit logs with IST formatted timestamps for display';
COMMENT ON VIEW sessions_ist IS 'Sessions with IST formatted timestamps for display';
COMMENT ON VIEW employees_ist IS 'Employees with IST formatted timestamps for display';

-- Test the functions to verify they work
SELECT 'IST Migration Completed Successfully!' as status;
SELECT now_ist() as current_ist_time;
SELECT to_ist(now()) as current_utc_to_ist;
SELECT format_audit_timestamp(now()) as audit_format;