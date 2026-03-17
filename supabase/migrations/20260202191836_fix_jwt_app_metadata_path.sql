/*
  # Fix JWT Path for Admin Role Check

  The role is stored in app_metadata, so the correct path is:
  auth.jwt()->'app_metadata'->>'role'

  ## Changes:
  - Update all admin policies to use correct JWT path
*/

-- accommodations
DROP POLICY IF EXISTS "Admins can manage accommodations" ON accommodations;
CREATE POLICY "Admins can manage accommodations"
  ON accommodations FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- accommodation_amenities
DROP POLICY IF EXISTS "Admins can manage accommodation amenities" ON accommodation_amenities;
CREATE POLICY "Admins can manage accommodation amenities"
  ON accommodation_amenities FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- accommodation_images
DROP POLICY IF EXISTS "Admins can manage accommodation images" ON accommodation_images;
CREATE POLICY "Admins can manage accommodation images"
  ON accommodation_images FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- bookings
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- amenity_categories
DROP POLICY IF EXISTS "Admins can manage amenity categories" ON amenity_categories;
CREATE POLICY "Admins can manage amenity categories"
  ON amenity_categories FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- amenities
DROP POLICY IF EXISTS "Admins can manage amenities" ON amenities;
CREATE POLICY "Admins can manage amenities"
  ON amenities FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- house_rules
DROP POLICY IF EXISTS "Admins can manage house rules" ON house_rules;
CREATE POLICY "Admins can manage house rules"
  ON house_rules FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- points_of_interest
DROP POLICY IF EXISTS "Admins can manage points of interest" ON points_of_interest;
CREATE POLICY "Admins can manage points of interest"
  ON points_of_interest FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- blocked_dates
DROP POLICY IF EXISTS "Admins can manage blocked dates" ON blocked_dates;
CREATE POLICY "Admins can manage blocked dates"
  ON blocked_dates FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- ical_feeds
DROP POLICY IF EXISTS "Admins can manage iCal feeds" ON ical_feeds;
CREATE POLICY "Admins can manage iCal feeds"
  ON ical_feeds FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- ical_events
DROP POLICY IF EXISTS "Admins can manage iCal events" ON ical_events;
CREATE POLICY "Admins can manage iCal events"
  ON ical_events FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- pricing_rules
DROP POLICY IF EXISTS "Admins can manage pricing rules" ON pricing_rules;
CREATE POLICY "Admins can manage pricing rules"
  ON pricing_rules FOR ALL
  TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');