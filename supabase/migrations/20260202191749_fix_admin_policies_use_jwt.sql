/*
  # Fix Admin RLS Policies - Use JWT Instead of Users Table

  The previous policies queried auth.users table directly, which causes
  "permission denied for table users" errors. This migration updates all
  admin policies to use auth.jwt() which reads from the JWT token directly.

  ## Changes:
  - Drop and recreate admin policies using auth.jwt()->>'role' check
  - Affects: accommodations, accommodation_amenities, accommodation_images, bookings
*/

-- Drop existing admin policies on accommodations
DROP POLICY IF EXISTS "Admins can manage accommodations" ON accommodations;
DROP POLICY IF EXISTS "Admins can view all accommodations" ON accommodations;

-- Create new admin policies using JWT
CREATE POLICY "Admins can manage accommodations"
  ON accommodations FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- Drop existing admin policies on accommodation_amenities
DROP POLICY IF EXISTS "Admins can manage accommodation amenities" ON accommodation_amenities;

CREATE POLICY "Admins can manage accommodation amenities"
  ON accommodation_amenities FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- Drop existing admin policies on accommodation_images
DROP POLICY IF EXISTS "Admins can manage accommodation images" ON accommodation_images;
DROP POLICY IF EXISTS "Admins can view all accommodation images" ON accommodation_images;

CREATE POLICY "Admins can manage accommodation images"
  ON accommodation_images FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- Drop existing admin policies on bookings
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');