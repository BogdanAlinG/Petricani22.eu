/*
  # Fix Categories RLS Policies for Admin Access

  1. Problem
    - Admin users cannot manage categories because they need SELECT permission
    - Current SELECT policy only allows public/anonymous access to active categories

  2. Solution
    - Add SELECT policy for authenticated admin users
    - This allows admins to view all categories for management
*/

CREATE POLICY "Admin can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (is_admin());
