/*
  # Fix guidebook DELETE RLS policies to match is_admin() function logic

  ## Problem
  The DELETE policies on guidebook_categories and guidebook_items also use
  the JWT `is_admin` field check, which fails for users with `role = 'admin'`.

  ## Fix
  Replace with is_admin() function calls for consistency.
*/

DROP POLICY IF EXISTS "Admins can delete guidebook categories" ON guidebook_categories;
DROP POLICY IF EXISTS "Admins can delete guidebook items" ON guidebook_items;

CREATE POLICY "Admins can delete guidebook categories"
  ON guidebook_categories FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete guidebook items"
  ON guidebook_items FOR DELETE
  TO authenticated
  USING (is_admin());
