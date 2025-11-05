/*
  # Fix Security Issues

  ## Changes Made
  
  1. **Remove Unused Indexes**
     - Drop `idx_machines_status` - unused index on machines.status
     - Drop `idx_machines_chc_id` - unused index on machines.chc_id
     - Drop `idx_machines_last_active` - unused index on machines.last_active
     - Drop `idx_alerts_machine_id` - unused index on alerts.machine_id
     - Drop `idx_alerts_is_read` - unused index on alerts.is_read
  
  2. **Fix Function Search Path**
     - Drop existing trigger on machines table
     - Recreate `update_updated_at_column` function with immutable search_path
     - Recreate trigger with the updated function
     - Set search_path to empty to prevent search path manipulation attacks
  
  ## Security Notes
  - Unused indexes consume storage and slow down write operations
  - Mutable search_path in functions can be exploited for privilege escalation
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_machines_status;
DROP INDEX IF EXISTS idx_machines_chc_id;
DROP INDEX IF EXISTS idx_machines_last_active;
DROP INDEX IF EXISTS idx_alerts_machine_id;
DROP INDEX IF EXISTS idx_alerts_is_read;

-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_machines_updated_at ON machines;

-- Drop and recreate the function with secure search_path
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();