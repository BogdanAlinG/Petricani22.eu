/*
  # Fix Products RLS Policies for Admin Access

  1. Problem
    - Admin users cannot insert/update/delete products because they also need SELECT permission
    - Current SELECT policy only allows public/anonymous access to available products
    - Authenticated admin users have no SELECT access at all

  2. Solution
    - Add SELECT policy for authenticated admin users
    - This allows admins to view all products (including unavailable ones) for management

  3. Security
    - Public can still only view available products
    - Admins can view all products for management purposes
*/

CREATE POLICY "Admin can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (is_admin());
