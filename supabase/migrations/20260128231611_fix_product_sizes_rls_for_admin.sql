/*
  # Fix Product Sizes RLS Policies for Admin Access

  1. Problem
    - Admin users cannot manage product sizes because they need SELECT permission
    - Current SELECT policy only allows public/anonymous access to available sizes

  2. Solution
    - Add SELECT policy for authenticated admin users
    - This allows admins to view all product sizes for management
*/

CREATE POLICY "Admin can view all product sizes"
  ON product_sizes
  FOR SELECT
  TO authenticated
  USING (is_admin());
