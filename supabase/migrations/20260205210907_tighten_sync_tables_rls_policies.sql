/*
  # Tighten RLS policies on sync tables

  1. Security Changes
    - `sync_configurations`: Remove overly permissive INSERT/UPDATE/DELETE policies,
      replace with admin-only policies using is_admin() function
    - `sync_logs`: Replace UPDATE policy with admin-only version (needed for stop/cancel)
    - `synced_products`: Remove all remaining write policies (edge function uses service role key)
    - `sync_log_details`: Drop redundant authenticated-user INSERT/DELETE policies,
      keep existing admin-only policies

  2. Important Notes
    - The sync edge function uses the service role key, which bypasses RLS entirely
    - These policies only restrict client-side access from the admin UI
    - SELECT policies remain open to authenticated users so the UI can display data
    - The is_admin() function checks auth.users for admin role/email
*/

-- sync_configurations: drop old permissive write policies, add admin-only
DROP POLICY IF EXISTS "Authenticated users can insert sync configurations" ON sync_configurations;
DROP POLICY IF EXISTS "Authenticated users can update sync configurations" ON sync_configurations;
DROP POLICY IF EXISTS "Authenticated users can delete sync configurations" ON sync_configurations;

CREATE POLICY "Admins can insert sync configurations"
  ON sync_configurations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update sync configurations"
  ON sync_configurations FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete sync configurations"
  ON sync_configurations FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- sync_logs: replace authenticated UPDATE with admin-only
DROP POLICY IF EXISTS "Authenticated users can update sync logs" ON sync_logs;

CREATE POLICY "Admins can update sync logs"
  ON sync_logs FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- synced_products: drop all write policies (service role only)
DROP POLICY IF EXISTS "Authenticated users can insert synced products" ON synced_products;
DROP POLICY IF EXISTS "Authenticated users can update synced products" ON synced_products;
DROP POLICY IF EXISTS "Authenticated users can delete synced products" ON synced_products;

-- sync_log_details: drop redundant authenticated-user write policies
DROP POLICY IF EXISTS "Authenticated users can insert sync log details" ON sync_log_details;
DROP POLICY IF EXISTS "Authenticated users can delete own sync log details" ON sync_log_details;
