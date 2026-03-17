/*
  # Add guidebook-related fields to accommodations

  ## Changes
  Adds columns needed by the digital guidebook guest page to the accommodations table:
  - `address` (text) - Full address for directions/maps link
  - `phone` (text) - Host contact phone number
  - `wifi_name` (text) - Wi-Fi network name
  - `wifi_password` (text) - Wi-Fi password
  - `latitude` (numeric) - GPS latitude for maps
  - `longitude` (numeric) - GPS longitude for maps

  ## Notes
  All columns are nullable since they are optional property details.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accommodations' AND column_name='address') THEN
    ALTER TABLE accommodations ADD COLUMN address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accommodations' AND column_name='phone') THEN
    ALTER TABLE accommodations ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accommodations' AND column_name='wifi_name') THEN
    ALTER TABLE accommodations ADD COLUMN wifi_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accommodations' AND column_name='wifi_password') THEN
    ALTER TABLE accommodations ADD COLUMN wifi_password text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accommodations' AND column_name='latitude') THEN
    ALTER TABLE accommodations ADD COLUMN latitude numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accommodations' AND column_name='longitude') THEN
    ALTER TABLE accommodations ADD COLUMN longitude numeric;
  END IF;
END $$;
