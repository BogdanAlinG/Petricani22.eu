/*
  # Create allergens translation system

  1. New Tables
    - `allergens`
      - `id` (uuid, primary key)
      - `name_en` (text, unique) - English allergen name
      - `name_ro` (text) - Romanian allergen name
      - `display_order` (integer) - Sort order
      - `created_at` (timestamptz)
    - `product_allergens`
      - `id` (uuid, primary key)
      - `product_id` (uuid, FK to products)
      - `allergen_id` (uuid, FK to allergens)
      - Unique constraint on (product_id, allergen_id)

  2. Seed Data
    - Common allergens with EN/RO translations

  3. Security
    - RLS enabled on both tables
    - Public read access for allergens (needed for menu display)
    - Admin-only write access
*/

CREATE TABLE IF NOT EXISTS allergens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ro text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT allergens_name_en_unique UNIQUE (name_en)
);

ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view allergens"
  ON allergens FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert allergens"
  ON allergens FOR INSERT
  TO authenticated
  WITH CHECK (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin')
  );

CREATE POLICY "Admins can update allergens"
  ON allergens FOR UPDATE
  TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin')
  )
  WITH CHECK (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin')
  );

CREATE POLICY "Admins can delete allergens"
  ON allergens FOR DELETE
  TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin')
  );

CREATE TABLE IF NOT EXISTS product_allergens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id uuid NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  CONSTRAINT product_allergens_unique UNIQUE (product_id, allergen_id)
);

CREATE INDEX IF NOT EXISTS idx_product_allergens_product_id ON product_allergens (product_id);
CREATE INDEX IF NOT EXISTS idx_product_allergens_allergen_id ON product_allergens (allergen_id);

ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product allergens"
  ON product_allergens FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can insert product allergens"
  ON product_allergens FOR INSERT
  TO authenticated
  WITH CHECK (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin')
  );

CREATE POLICY "Admins can update product allergens"
  ON product_allergens FOR UPDATE
  TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin')
  )
  WITH CHECK (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin')
  );

CREATE POLICY "Admins can delete product allergens"
  ON product_allergens FOR DELETE
  TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin')
  );

INSERT INTO allergens (name_en, name_ro, display_order) VALUES
  ('Gluten', 'Gluten', 1),
  ('Milk', 'Lapte', 2),
  ('Eggs', 'Ouă', 3),
  ('Nuts', 'Fructe cu coajă lemnoasă', 4),
  ('Peanuts', 'Arahide', 5),
  ('Soy', 'Soia', 6),
  ('Celery', 'Țelină', 7),
  ('Mustard', 'Muștar', 8),
  ('Sesame', 'Susan', 9),
  ('Sulphites', 'Sulfiți', 10),
  ('Lactose', 'Lactoză', 11),
  ('Fish', 'Pește', 12),
  ('Shellfish', 'Crustacee', 13),
  ('Lupin', 'Lupin', 14),
  ('Molluscs', 'Moluște', 15)
ON CONFLICT (name_en) DO NOTHING;

DO $$
DECLARE
  r record;
  raw_allergen text;
  clean_allergen text;
  matched_allergen_id uuid;
  allergen_map jsonb := '{
    "gluten": "Gluten",
    "gluten de grâu": "Gluten",
    "gluten from cereals": "Gluten",
    "wheat bran (gluten)": "Gluten",
    "milk": "Milk",
    "lapte": "Milk",
    "egg": "Eggs",
    "eggs": "Eggs",
    "ou": "Eggs",
    "ouă": "Eggs",
    "nuts": "Nuts",
    "walnuts": "Nuts",
    "alune": "Nuts",
    "fructe cu coajă lemnoasă": "Nuts",
    "peanuts": "Peanuts",
    "arahide": "Peanuts",
    "soy": "Soy",
    "soia": "Soy",
    "celery": "Celery",
    "țelină": "Celery",
    "mustard": "Mustard",
    "muștar": "Mustard",
    "sesame": "Sesame",
    "susan": "Sesame",
    "semințe de susan": "Sesame",
    "seeds": "Sesame",
    "sulphites": "Sulphites",
    "sulfites": "Sulphites",
    "sulfiți": "Sulphites",
    "lactose": "Lactose",
    "lactoză": "Lactose"
  }'::jsonb;
  mapped_en text;
BEGIN
  FOR r IN
    SELECT id, allergen_info FROM products
    WHERE allergen_info IS NOT NULL AND array_length(allergen_info, 1) > 0
  LOOP
    FOREACH raw_allergen IN ARRAY r.allergen_info
    LOOP
      clean_allergen := lower(trim(raw_allergen));

      IF length(clean_allergen) > 50 OR clean_allergen ~ '<' OR clean_allergen ~ 'font-size' OR clean_allergen ~ 'style' THEN
        CONTINUE;
      END IF;

      clean_allergen := regexp_replace(clean_allergen, '^</strong>\s*', '', 'i');

      mapped_en := allergen_map ->> clean_allergen;

      IF mapped_en IS NOT NULL THEN
        SELECT id INTO matched_allergen_id FROM allergens WHERE name_en = mapped_en;
        IF matched_allergen_id IS NOT NULL THEN
          INSERT INTO product_allergens (product_id, allergen_id)
          VALUES (r.id, matched_allergen_id)
          ON CONFLICT (product_id, allergen_id) DO NOTHING;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;
