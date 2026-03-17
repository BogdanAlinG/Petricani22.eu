/*
  # Fix guidebook UPDATE RLS policies to match is_admin() function logic

  ## Problem
  The UPDATE policies on guidebook_categories and guidebook_items check for
  `is_admin = 'true'` in the JWT app_metadata, but the admin user's app_metadata
  has `role = 'admin'` instead. This causes UPDATE operations to silently fail
  (no error, no rows updated) for the actual admin user.

  ## Fix
  Replace the UPDATE policies to use the same is_admin() function that the
  INSERT policies already use correctly. is_admin() accepts both
  `role = 'admin'` and `is_admin = 'true'` in app_metadata.
*/

DROP POLICY IF EXISTS "Admins can update guidebook categories" ON guidebook_categories;
DROP POLICY IF EXISTS "Admins can update guidebook items" ON guidebook_items;

CREATE POLICY "Admins can update guidebook categories"
  ON guidebook_categories FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update guidebook items"
  ON guidebook_items FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
