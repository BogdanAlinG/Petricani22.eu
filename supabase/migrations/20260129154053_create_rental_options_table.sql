/*
  # Create Rental Options Table

  1. New Tables
    - `rental_options`
      - `id` (uuid, primary key)
      - `slug` (text, unique identifier for the option e.g., 'complete', 'floors', 'rooms', 'outdoor')
      - `icon` (text, Lucide icon name)
      - `title_en` (text, English title)
      - `title_ro` (text, Romanian title)
      - `description_en` (text, English description)
      - `description_ro` (text, Romanian description)
      - `features_en` (text array, English features list)
      - `features_ro` (text array, Romanian features list)
      - `price_daily` (numeric, daily price in EUR)
      - `price_weekly` (numeric, weekly price in EUR)
      - `price_monthly` (numeric, monthly price in EUR)
      - `price_yearly` (numeric, yearly price in EUR)
      - `display_order` (integer, for sorting)
      - `is_visible` (boolean, whether to show on frontend)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `rental_options` table
    - Add policy for public read access (visible options only)
    - Add policy for authenticated admin users to manage options

  3. Initial Data
    - Seed with current hardcoded rental options
*/

CREATE TABLE IF NOT EXISTS rental_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'Home',
  title_en text NOT NULL,
  title_ro text NOT NULL,
  description_en text NOT NULL DEFAULT '',
  description_ro text NOT NULL DEFAULT '',
  features_en text[] NOT NULL DEFAULT '{}',
  features_ro text[] NOT NULL DEFAULT '{}',
  price_daily numeric(10, 2) NOT NULL DEFAULT 0,
  price_weekly numeric(10, 2) NOT NULL DEFAULT 0,
  price_monthly numeric(10, 2) NOT NULL DEFAULT 0,
  price_yearly numeric(10, 2) NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rental_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible rental options"
  ON rental_options
  FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Authenticated users can view all rental options"
  ON rental_options
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rental options"
  ON rental_options
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rental options"
  ON rental_options
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rental options"
  ON rental_options
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_rental_options_display_order ON rental_options(display_order);
CREATE INDEX IF NOT EXISTS idx_rental_options_is_visible ON rental_options(is_visible);

INSERT INTO rental_options (slug, icon, title_en, title_ro, description_en, description_ro, features_en, features_ro, price_daily, price_weekly, price_monthly, price_yearly, display_order) VALUES
('complete', 'Home', 'Complete Property', 'Proprietate Completă', 'Entire property with all facilities', 'Întreaga proprietate cu toate facilitățile', ARRAY['12 rooms', '6 bathrooms', 'Private garden', 'Parking'], ARRAY['12 camere', '6 băi', 'Grădină privată', 'Parcare'], 350, 2200, 8600, 92880, 0),
('floors', 'Users', 'Floor-by-Floor', 'Etaj cu Etaj', 'Separate rental for each level', 'Închiriere separată pentru fiecare nivel', ARRAY['6 rooms/floor', '3 bathrooms/floor', 'Separate access', 'Private areas'], ARRAY['6 camere/etaj', '3 băi/etaj', 'Acces separat', 'Spații private'], 150, 945, 3700, 39900, 1),
('rooms', 'Bed', 'Individual Rooms', 'Camere Individuale', 'Room rental with shared facilities', 'Închiriere pe camere cu facilități comune', ARRAY['1 room', 'Shared bathroom', 'Shared kitchen', 'Common areas'], ARRAY['1 cameră', 'Baie comună', 'Bucătărie comună', 'Spații comune'], 25, 155, 615, 6640, 2),
('outdoor', 'Calendar', 'Outdoor Space', 'Spațiu Exterior', 'Garden and courtyard for events', 'Grădina și curtea pentru evenimente', ARRAY['Private garden', 'Pizza oven', 'Event spaces', 'Parking'], ARRAY['Grădină privată', 'Cuptor pizza', 'Spații evenimente', 'Parcare'], 200, 1260, 4900, 52900, 3)
ON CONFLICT (slug) DO NOTHING;
