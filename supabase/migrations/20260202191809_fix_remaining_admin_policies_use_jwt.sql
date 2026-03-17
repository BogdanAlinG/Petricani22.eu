/*
  # Fix Remaining Admin RLS Policies - Use JWT Instead of Users Table

  Updates remaining admin policies that were still querying auth.users directly.

  ## Changes:
  - Update policies on: amenity_categories, amenities, house_rules,
    points_of_interest, blocked_dates, ical_feeds, ical_events, pricing_rules
*/

-- amenity_categories
DROP POLICY IF EXISTS "Admins can manage amenity categories" ON amenity_categories;
CREATE POLICY "Admins can manage amenity categories"
  ON amenity_categories FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- amenities
DROP POLICY IF EXISTS "Admins can manage amenities" ON amenities;
CREATE POLICY "Admins can manage amenities"
  ON amenities FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- house_rules
DROP POLICY IF EXISTS "Admins can manage house rules" ON house_rules;
CREATE POLICY "Admins can manage house rules"
  ON house_rules FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- points_of_interest
DROP POLICY IF EXISTS "Admins can manage points of interest" ON points_of_interest;
CREATE POLICY "Admins can manage points of interest"
  ON points_of_interest FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- blocked_dates
DROP POLICY IF EXISTS "Admins can manage blocked dates" ON blocked_dates;
CREATE POLICY "Admins can manage blocked dates"
  ON blocked_dates FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- ical_feeds
DROP POLICY IF EXISTS "Admins can manage iCal feeds" ON ical_feeds;
CREATE POLICY "Admins can manage iCal feeds"
  ON ical_feeds FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- ical_events
DROP POLICY IF EXISTS "Admins can manage iCal events" ON ical_events;
CREATE POLICY "Admins can manage iCal events"
  ON ical_events FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');

-- pricing_rules
DROP POLICY IF EXISTS "Admins can manage pricing rules" ON pricing_rules;
CREATE POLICY "Admins can manage pricing rules"
  ON pricing_rules FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->>'role') = 'admin');