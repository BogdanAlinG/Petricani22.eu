-- Add show_house_rules flag to accommodations
-- Defaults to true so existing rentals are unaffected
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS show_house_rules boolean NOT NULL DEFAULT true;
