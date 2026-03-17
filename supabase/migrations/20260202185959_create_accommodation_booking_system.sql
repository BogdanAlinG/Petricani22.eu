/*
  # Accommodation and Booking System

  This migration creates a comprehensive accommodation management and booking system with:
  - Accommodation units with multilingual content
  - Image galleries for each accommodation
  - Amenities system with categories
  - Booking management with payment tracking
  - Calendar blocking and availability management
  - iCal feed synchronization for Airbnb/Booking.com integration
  - Seasonal pricing rules
  - House rules and points of interest

  ## Tables Created:
  1. accommodations - Main accommodation units
  2. accommodation_images - Image galleries
  3. amenity_categories - Amenity groupings
  4. amenities - Individual amenity items
  5. accommodation_amenities - Junction table
  6. house_rules - Property policies
  7. points_of_interest - Nearby locations
  8. bookings - Guest reservations
  9. blocked_dates - Manual date blocking
  10. ical_feeds - External calendar configs
  11. ical_events - Parsed calendar events
  12. pricing_rules - Seasonal pricing

  ## Security:
  - RLS enabled on all tables
  - Public read for visible accommodations
  - Admin-only write access
*/

-- Accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_ro text NOT NULL,
  short_description_en text DEFAULT '',
  short_description_ro text DEFAULT '',
  description_en text DEFAULT '',
  description_ro text DEFAULT '',
  unit_type text NOT NULL DEFAULT 'room',
  beds integer NOT NULL DEFAULT 1,
  bathrooms numeric(3,1) NOT NULL DEFAULT 1,
  max_guests integer NOT NULL DEFAULT 2,
  sqm numeric(8,2),
  base_price_per_night numeric(10,2) NOT NULL DEFAULT 0,
  cleaning_fee numeric(10,2) DEFAULT 0,
  minimum_nights integer NOT NULL DEFAULT 1,
  maximum_nights integer DEFAULT 365,
  check_in_time text DEFAULT '15:00',
  check_out_time text DEFAULT '11:00',
  thumbnail_url text,
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accommodations' AND policyname = 'Anyone can view visible accommodations') THEN
    CREATE POLICY "Anyone can view visible accommodations"
      ON accommodations FOR SELECT
      USING (is_visible = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accommodations' AND policyname = 'Admins can manage accommodations') THEN
    CREATE POLICY "Admins can manage accommodations"
      ON accommodations FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- Accommodation images table
CREATE TABLE IF NOT EXISTS accommodation_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text_en text DEFAULT '',
  alt_text_ro text DEFAULT '',
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accommodation_images_accommodation_id ON accommodation_images(accommodation_id);

ALTER TABLE accommodation_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accommodation_images' AND policyname = 'Anyone can view accommodation images') THEN
    CREATE POLICY "Anyone can view accommodation images"
      ON accommodation_images FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM accommodations
          WHERE accommodations.id = accommodation_images.accommodation_id
          AND accommodations.is_visible = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accommodation_images' AND policyname = 'Admins can manage accommodation images') THEN
    CREATE POLICY "Admins can manage accommodation images"
      ON accommodation_images FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- Amenity categories table
CREATE TABLE IF NOT EXISTS amenity_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ro text NOT NULL,
  icon text DEFAULT 'Star',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE amenity_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'amenity_categories' AND policyname = 'Anyone can view amenity categories') THEN
    CREATE POLICY "Anyone can view amenity categories"
      ON amenity_categories FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'amenity_categories' AND policyname = 'Admins can manage amenity categories') THEN
    CREATE POLICY "Admins can manage amenity categories"
      ON amenity_categories FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- Amenities table
CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES amenity_categories(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ro text NOT NULL,
  icon text DEFAULT 'Check',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amenities_category_id ON amenities(category_id);

ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'amenities' AND policyname = 'Anyone can view amenities') THEN
    CREATE POLICY "Anyone can view amenities"
      ON amenities FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'amenities' AND policyname = 'Admins can manage amenities') THEN
    CREATE POLICY "Admins can manage amenities"
      ON amenities FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- Junction table for accommodation amenities
CREATE TABLE IF NOT EXISTS accommodation_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(accommodation_id, amenity_id)
);

CREATE INDEX IF NOT EXISTS idx_accommodation_amenities_accommodation_id ON accommodation_amenities(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_amenities_amenity_id ON accommodation_amenities(amenity_id);

ALTER TABLE accommodation_amenities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accommodation_amenities' AND policyname = 'Anyone can view accommodation amenities') THEN
    CREATE POLICY "Anyone can view accommodation amenities"
      ON accommodation_amenities FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM accommodations
          WHERE accommodations.id = accommodation_amenities.accommodation_id
          AND accommodations.is_visible = true
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accommodation_amenities' AND policyname = 'Admins can manage accommodation amenities') THEN
    CREATE POLICY "Admins can manage accommodation amenities"
      ON accommodation_amenities FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- House rules table
CREATE TABLE IF NOT EXISTS house_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_ro text NOT NULL,
  description_en text DEFAULT '',
  description_ro text DEFAULT '',
  icon text DEFAULT 'Info',
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE house_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'house_rules' AND policyname = 'Anyone can view visible house rules') THEN
    CREATE POLICY "Anyone can view visible house rules"
      ON house_rules FOR SELECT
      USING (is_visible = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'house_rules' AND policyname = 'Admins can manage house rules') THEN
    CREATE POLICY "Admins can manage house rules"
      ON house_rules FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- Points of interest table
CREATE TABLE IF NOT EXISTS points_of_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ro text NOT NULL,
  category text NOT NULL DEFAULT 'attraction',
  distance_text text,
  travel_time text,
  google_maps_url text,
  icon text DEFAULT 'MapPin',
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'points_of_interest' AND policyname = 'Anyone can view visible points of interest') THEN
    CREATE POLICY "Anyone can view visible points of interest"
      ON points_of_interest FOR SELECT
      USING (is_visible = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'points_of_interest' AND policyname = 'Admins can manage points of interest') THEN
    CREATE POLICY "Admins can manage points of interest"
      ON points_of_interest FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text UNIQUE NOT NULL,
  accommodation_id uuid NOT NULL REFERENCES accommodations(id) ON DELETE RESTRICT,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  num_guests integer NOT NULL DEFAULT 1,
  total_nights integer NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  cleaning_fee numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  payment_method text DEFAULT 'stripe',
  payment_status text DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_charge_id text,
  booking_status text DEFAULT 'pending',
  special_requests text,
  source text DEFAULT 'direct',
  external_booking_id text,
  cancellation_reason text,
  cancelled_at timestamptz,
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT valid_status CHECK (booking_status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_accommodation_id ON bookings(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in_date ON bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out_date ON bookings(check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings(guest_email);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can manage all bookings') THEN
    CREATE POLICY "Admins can manage all bookings"
      ON bookings FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Allow anonymous booking creation') THEN
    CREATE POLICY "Allow anonymous booking creation"
      ON bookings FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Anyone can view bookings') THEN
    CREATE POLICY "Anyone can view bookings"
      ON bookings FOR SELECT
      USING (true);
  END IF;
END $$;

-- Blocked dates table for manual blocking
CREATE TABLE IF NOT EXISTS blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_block_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_accommodation_id ON blocked_dates(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_dates ON blocked_dates(start_date, end_date);

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_dates' AND policyname = 'Anyone can view blocked dates') THEN
    CREATE POLICY "Anyone can view blocked dates"
      ON blocked_dates FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_dates' AND policyname = 'Admins can manage blocked dates') THEN
    CREATE POLICY "Admins can manage blocked dates"
      ON blocked_dates FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- iCal feeds table for external calendar sync
CREATE TABLE IF NOT EXISTS ical_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'other',
  feed_name text NOT NULL,
  feed_url text NOT NULL,
  last_synced_at timestamptz,
  sync_status text DEFAULT 'pending',
  sync_error text,
  sync_interval_minutes integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_platform CHECK (platform IN ('airbnb', 'booking', 'vrbo', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_ical_feeds_accommodation_id ON ical_feeds(accommodation_id);

ALTER TABLE ical_feeds ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ical_feeds' AND policyname = 'Admins can manage iCal feeds') THEN
    CREATE POLICY "Admins can manage iCal feeds"
      ON ical_feeds FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- iCal events table for parsed external calendar events
CREATE TABLE IF NOT EXISTS ical_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ical_feed_id uuid NOT NULL REFERENCES ical_feeds(id) ON DELETE CASCADE,
  uid text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  summary text,
  description text,
  source_platform text,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(ical_feed_id, uid)
);

CREATE INDEX IF NOT EXISTS idx_ical_events_feed_id ON ical_events(ical_feed_id);
CREATE INDEX IF NOT EXISTS idx_ical_events_dates ON ical_events(start_date, end_date);

ALTER TABLE ical_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ical_events' AND policyname = 'Anyone can view iCal events for availability') THEN
    CREATE POLICY "Anyone can view iCal events for availability"
      ON ical_events FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ical_events' AND policyname = 'Admins can manage iCal events') THEN
    CREATE POLICY "Admins can manage iCal events"
      ON ical_events FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- Pricing rules table for seasonal/promotional pricing
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid REFERENCES accommodations(id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_modifier_type text NOT NULL DEFAULT 'percentage',
  price_modifier_value numeric(10,2) NOT NULL,
  minimum_nights_override integer,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_rule_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_modifier_type CHECK (price_modifier_type IN ('percentage', 'fixed', 'override'))
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_accommodation_id ON pricing_rules(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pricing_rules' AND policyname = 'Anyone can view active pricing rules') THEN
    CREATE POLICY "Anyone can view active pricing rules"
      ON pricing_rules FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pricing_rules' AND policyname = 'Admins can manage pricing rules') THEN
    CREATE POLICY "Admins can manage pricing rules"
      ON pricing_rules FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number text;
  exists_check boolean;
BEGIN
  LOOP
    new_number := 'BK' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4));
    SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_number = new_number) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate booking number
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_booking_number ON bookings;
CREATE TRIGGER trigger_set_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_number();

-- Function to check availability
CREATE OR REPLACE FUNCTION check_availability(
  p_accommodation_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_conflict boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE accommodation_id = p_accommodation_id
    AND booking_status NOT IN ('cancelled')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND check_in_date < p_check_out
    AND check_out_date > p_check_in

    UNION ALL

    SELECT 1 FROM blocked_dates
    WHERE accommodation_id = p_accommodation_id
    AND start_date < p_check_out
    AND end_date >= p_check_in

    UNION ALL

    SELECT 1 FROM ical_events ie
    JOIN ical_feeds if_table ON ie.ical_feed_id = if_table.id
    WHERE if_table.accommodation_id = p_accommodation_id
    AND if_table.is_active = true
    AND ie.start_date < p_check_out
    AND ie.end_date > p_check_in
  ) INTO has_conflict;

  RETURN NOT has_conflict;
END;
$$;

-- Seed default amenity categories
INSERT INTO amenity_categories (slug, name_en, name_ro, icon, display_order) VALUES
  ('bedroom', 'Bedroom', 'Dormitor', 'Bed', 1),
  ('bathroom', 'Bathroom', 'Baie', 'Bath', 2),
  ('kitchen', 'Kitchen', 'Bucătărie', 'ChefHat', 3),
  ('entertainment', 'Entertainment', 'Divertisment', 'Tv', 4),
  ('outdoor', 'Outdoor', 'Exterior', 'TreePine', 5),
  ('parking', 'Parking & Transport', 'Parcare & Transport', 'Car', 6),
  ('safety', 'Safety', 'Siguranță', 'Shield', 7),
  ('services', 'Services', 'Servicii', 'Sparkles', 8)
ON CONFLICT (slug) DO NOTHING;

-- Seed common amenities
INSERT INTO amenities (category_id, slug, name_en, name_ro, icon, display_order) VALUES
  ((SELECT id FROM amenity_categories WHERE slug = 'bedroom'), 'air-conditioning', 'Air Conditioning', 'Aer Conditionat', 'Wind', 1),
  ((SELECT id FROM amenity_categories WHERE slug = 'bedroom'), 'heating', 'Heating', 'Incalzire', 'Flame', 2),
  ((SELECT id FROM amenity_categories WHERE slug = 'bedroom'), 'wardrobe', 'Wardrobe', 'Dulap', 'Archive', 3),
  ((SELECT id FROM amenity_categories WHERE slug = 'bedroom'), 'desk', 'Work Desk', 'Birou de Lucru', 'Monitor', 4),
  ((SELECT id FROM amenity_categories WHERE slug = 'bedroom'), 'blackout-curtains', 'Blackout Curtains', 'Draperii Blackout', 'Moon', 5),
  ((SELECT id FROM amenity_categories WHERE slug = 'bathroom'), 'shower', 'Shower', 'Dus', 'Droplets', 1),
  ((SELECT id FROM amenity_categories WHERE slug = 'bathroom'), 'bathtub', 'Bathtub', 'Cada', 'Bath', 2),
  ((SELECT id FROM amenity_categories WHERE slug = 'bathroom'), 'hairdryer', 'Hair Dryer', 'Uscator de Par', 'Wind', 3),
  ((SELECT id FROM amenity_categories WHERE slug = 'bathroom'), 'toiletries', 'Toiletries', 'Articole de Toaleta', 'Sparkles', 4),
  ((SELECT id FROM amenity_categories WHERE slug = 'bathroom'), 'towels', 'Fresh Towels', 'Prosoape Curate', 'Layers', 5),
  ((SELECT id FROM amenity_categories WHERE slug = 'kitchen'), 'full-kitchen', 'Full Kitchen', 'Bucatarie Completa', 'ChefHat', 1),
  ((SELECT id FROM amenity_categories WHERE slug = 'kitchen'), 'refrigerator', 'Refrigerator', 'Frigider', 'Refrigerator', 2),
  ((SELECT id FROM amenity_categories WHERE slug = 'kitchen'), 'microwave', 'Microwave', 'Cuptor cu Microunde', 'Microwave', 3),
  ((SELECT id FROM amenity_categories WHERE slug = 'kitchen'), 'coffee-maker', 'Coffee Maker', 'Aparat de Cafea', 'Coffee', 4),
  ((SELECT id FROM amenity_categories WHERE slug = 'kitchen'), 'dishwasher', 'Dishwasher', 'Masina de Spalat Vase', 'Waves', 5),
  ((SELECT id FROM amenity_categories WHERE slug = 'entertainment'), 'smart-tv', 'Smart TV', 'Smart TV', 'Tv', 1),
  ((SELECT id FROM amenity_categories WHERE slug = 'entertainment'), 'wifi', 'High-Speed WiFi', 'WiFi de Mare Viteza', 'Wifi', 2),
  ((SELECT id FROM amenity_categories WHERE slug = 'entertainment'), 'streaming', 'Streaming Services', 'Servicii de Streaming', 'Play', 3),
  ((SELECT id FROM amenity_categories WHERE slug = 'entertainment'), 'bluetooth-speaker', 'Bluetooth Speaker', 'Boxa Bluetooth', 'Speaker', 4),
  ((SELECT id FROM amenity_categories WHERE slug = 'outdoor'), 'balcony', 'Balcony', 'Balcon', 'Home', 1),
  ((SELECT id FROM amenity_categories WHERE slug = 'outdoor'), 'terrace', 'Terrace', 'Terasa', 'TreePine', 2),
  ((SELECT id FROM amenity_categories WHERE slug = 'outdoor'), 'garden', 'Garden Access', 'Acces la Gradina', 'Flower2', 3),
  ((SELECT id FROM amenity_categories WHERE slug = 'outdoor'), 'bbq', 'BBQ Grill', 'Gratar', 'Flame', 4),
  ((SELECT id FROM amenity_categories WHERE slug = 'parking'), 'free-parking', 'Free Parking', 'Parcare Gratuita', 'Car', 1),
  ((SELECT id FROM amenity_categories WHERE slug = 'parking'), 'garage', 'Garage', 'Garaj', 'Warehouse', 2),
  ((SELECT id FROM amenity_categories WHERE slug = 'parking'), 'ev-charging', 'EV Charging', 'Incarcare Vehicule Electrice', 'Zap', 3),
  ((SELECT id FROM amenity_categories WHERE slug = 'safety'), 'smoke-detector', 'Smoke Detector', 'Detector de Fum', 'AlertTriangle', 1),
  ((SELECT id FROM amenity_categories WHERE slug = 'safety'), 'fire-extinguisher', 'Fire Extinguisher', 'Extinctor', 'Flame', 2),
  ((SELECT id FROM amenity_categories WHERE slug = 'safety'), 'first-aid', 'First Aid Kit', 'Trusa de Prim Ajutor', 'Cross', 3),
  ((SELECT id FROM amenity_categories WHERE slug = 'safety'), 'safe', 'Safe', 'Seif', 'Lock', 4),
  ((SELECT id FROM amenity_categories WHERE slug = 'services'), 'daily-cleaning', 'Daily Cleaning', 'Curatenie Zilnica', 'Sparkles', 1),
  ((SELECT id FROM amenity_categories WHERE slug = 'services'), 'laundry', 'Laundry Service', 'Serviciu de Spalatorie', 'Shirt', 2),
  ((SELECT id FROM amenity_categories WHERE slug = 'services'), 'concierge', 'Concierge', 'Concierge', 'UserCheck', 3),
  ((SELECT id FROM amenity_categories WHERE slug = 'services'), 'luggage-storage', 'Luggage Storage', 'Depozitare Bagaje', 'Briefcase', 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed default house rules
INSERT INTO house_rules (slug, title_en, title_ro, description_en, description_ro, icon, display_order) VALUES
  ('no-smoking', 'No Smoking', 'Fumatul Interzis', 'Smoking is not permitted anywhere on the property', 'Fumatul nu este permis nicaieri in proprietate', 'Ban', 1),
  ('no-parties', 'No Parties', 'Fara Petreceri', 'Parties and events are not allowed', 'Petrecerile si evenimentele nu sunt permise', 'PartyPopper', 2),
  ('pets', 'Pets Allowed', 'Animale Permise', 'Well-behaved pets are welcome with prior approval', 'Animalele de companie bine crescute sunt binevenite cu aprobare prealabila', 'PawPrint', 3),
  ('quiet-hours', 'Quiet Hours', 'Ore de Liniste', 'Please maintain quiet between 10 PM and 8 AM', 'Va rugam sa pastrati linistea intre 22:00 si 8:00', 'Moon', 4),
  ('check-in', 'Check-in Time', 'Ora de Check-in', 'Check-in is available from 3:00 PM', 'Check-in-ul este disponibil de la 15:00', 'Clock', 5),
  ('check-out', 'Check-out Time', 'Ora de Check-out', 'Check-out must be completed by 11:00 AM', 'Check-out-ul trebuie finalizat pana la 11:00', 'LogOut', 6)
ON CONFLICT (slug) DO NOTHING;