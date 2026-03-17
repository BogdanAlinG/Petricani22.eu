/*
  # Digital Guidebook System v2

  ## Overview
  Creates a complete digital guidebook system for guests. Hosts can manage
  property manuals with categories and items supporting bilingual content (EN/RO).

  ## New Tables

  ### guidebook_categories
  - Groups of related guidebook items (e.g., "Arrival", "House Rules", "Local Tips")
  - `accommodation_id` NULL = Global category (visible everywhere)
  - `accommodation_id` SET = Unit-specific category
  - Bilingual title support (EN/RO)
  - Lucide icon identifier for visual representation
  - Display ordering

  ### guidebook_items
  - Individual content entries within a category
  - Bilingual title and content (Markdown supported)
  - Optional image attachment from media library
  - `accommodation_id` NULL = Global item
  - `accommodation_id` SET = Unit-specific item
  - Display ordering

  ## Security
  - RLS enabled on both tables
  - Admins can perform all CRUD operations
  - Public can read all items for guest access
*/

CREATE TABLE IF NOT EXISTS guidebook_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid REFERENCES accommodations(id) ON DELETE CASCADE,
  title_en text NOT NULL DEFAULT '',
  title_ro text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'BookOpen',
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guidebook_categories_accommodation_id
  ON guidebook_categories(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_guidebook_categories_display_order
  ON guidebook_categories(display_order);

ALTER TABLE guidebook_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guidebook_categories' AND policyname='Admins can manage guidebook categories') THEN
    CREATE POLICY "Admins can manage guidebook categories"
      ON guidebook_categories FOR INSERT TO authenticated WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guidebook_categories' AND policyname='Admins can update guidebook categories') THEN
    CREATE POLICY "Admins can update guidebook categories"
      ON guidebook_categories FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guidebook_categories' AND policyname='Admins can delete guidebook categories') THEN
    CREATE POLICY "Admins can delete guidebook categories"
      ON guidebook_categories FOR DELETE TO authenticated USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guidebook_categories' AND policyname='Anyone can read guidebook categories') THEN
    CREATE POLICY "Anyone can read guidebook categories"
      ON guidebook_categories FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;


CREATE TABLE IF NOT EXISTS guidebook_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES guidebook_categories(id) ON DELETE CASCADE,
  accommodation_id uuid REFERENCES accommodations(id) ON DELETE CASCADE,
  title_en text NOT NULL DEFAULT '',
  title_ro text NOT NULL DEFAULT '',
  content_en text NOT NULL DEFAULT '',
  content_ro text NOT NULL DEFAULT '',
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guidebook_items_category_id
  ON guidebook_items(category_id);
CREATE INDEX IF NOT EXISTS idx_guidebook_items_accommodation_id
  ON guidebook_items(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_guidebook_items_display_order
  ON guidebook_items(display_order);

ALTER TABLE guidebook_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guidebook_items' AND policyname='Admins can manage guidebook items') THEN
    CREATE POLICY "Admins can manage guidebook items"
      ON guidebook_items FOR INSERT TO authenticated WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guidebook_items' AND policyname='Admins can update guidebook items') THEN
    CREATE POLICY "Admins can update guidebook items"
      ON guidebook_items FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guidebook_items' AND policyname='Admins can delete guidebook items') THEN
    CREATE POLICY "Admins can delete guidebook items"
      ON guidebook_items FOR DELETE TO authenticated USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guidebook_items' AND policyname='Anyone can read guidebook items') THEN
    CREATE POLICY "Anyone can read guidebook items"
      ON guidebook_items FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM guidebook_categories LIMIT 1) THEN
    INSERT INTO guidebook_categories (title_en, title_ro, icon, display_order, accommodation_id) VALUES
      ('Arrival & Check-in', 'Sosire & Check-in', 'DoorOpen', 1, NULL),
      ('Wi-Fi & Technology', 'Wi-Fi & Tehnologie', 'Wifi', 2, NULL),
      ('House Rules', 'Reguli Casă', 'ScrollText', 3, NULL),
      ('Parking & Yard', 'Parcare & Curte', 'ParkingSquare', 4, NULL),
      ('Local Recommendations', 'Recomandări Locale', 'MapPin', 5, NULL);
  END IF;
END $$;
