/*
  # Fix guidebook INSERT RLS policies - remove duplicate JWT-path policies

  ## Problem
  There are two INSERT policies on each guidebook table:
  - "Admins can manage guidebook X" using is_admin() - works correctly
  - "Admins can insert guidebook X" using JWT is_admin field - would fail for role=admin users

  ## Fix
  Remove the redundant JWT-path INSERT policies since is_admin() already covers all cases.
*/

DROP POLICY IF EXISTS "Admins can insert guidebook categories" ON guidebook_categories;
DROP POLICY IF EXISTS "Admins can insert guidebook items" ON guidebook_items;
