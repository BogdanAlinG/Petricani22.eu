/*
  # Fix is_admin Function to Use Security Definer

  The is_admin() function queries auth.users which requires elevated privileges.
  By making it SECURITY DEFINER, it runs with owner privileges and can access auth.users.

  ## Changes:
  - Recreate is_admin() function with SECURITY DEFINER
  - Set search_path for security
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_app_meta_data->>'role' = 'admin'
      OR raw_app_meta_data->>'is_admin' = 'true'
      OR email LIKE '%@petricani22.eu'
    )
  );
$$;