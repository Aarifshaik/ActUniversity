/*
  # Prevent Employee ID Updates

  This migration adds database-level protection to prevent emp_id changes
  after employee creation, ensuring data integrity and audit trail consistency.
*/

-- Create a function to prevent emp_id updates
CREATE OR REPLACE FUNCTION prevent_empid_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if emp_id is being changed
  IF OLD.emp_id IS DISTINCT FROM NEW.emp_id THEN
    RAISE EXCEPTION 'Employee ID cannot be changed after creation'
      USING ERRCODE = 'check_violation',
            HINT = 'Employee IDs are immutable for security and audit integrity';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent emp_id updates
DROP TRIGGER IF EXISTS prevent_empid_update_trigger ON employees;
CREATE TRIGGER prevent_empid_update_trigger
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION prevent_empid_update();

-- Add a comment to document this security measure
COMMENT ON TRIGGER prevent_empid_update_trigger ON employees IS 
'Prevents emp_id changes after employee creation for security and audit integrity';