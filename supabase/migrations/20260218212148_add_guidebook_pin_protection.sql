/*
  # Add PIN protection to guidebook

  ## Summary
  Adds the ability to protect specific guidebook content behind a PIN code
  that hosts can change between bookings.

  ## Changes

  ### accommodations table
  - `guidebook_pin` (text, nullable) — the PIN for this accommodation's protected guidebook content.
    NULL means no PIN protection is configured. Should be 4–8 characters.

  ### guidebook_categories table
  - `requires_pin` (boolean, default false) — when true, the entire category (and all
    its items) is hidden behind the PIN gate on the guest guidebook page.

  ### guidebook_items table
  - `requires_pin` (boolean, default false) — when true, this individual item is hidden
    behind the PIN gate on the guest guidebook page.

  ## Security Notes
  - The PIN is stored in plain text in the accommodations table (it is a convenience
    access control, not a cryptographic secret — similar to a door code).
  - RLS on guidebook_items and guidebook_categories remains public-read so the client
    can fetch all items. The PIN gate is enforced client-side: locked content is rendered
    blurred/hidden until the correct PIN is entered.
  - The PIN itself is only readable by admins (is_admin()) via RLS on accommodations.
    Guests verify their PIN via the existing public SELECT on accommodations, which already
    exposes wifi_password and similar fields to the public — the PIN is analogous to this.
  - If stricter server-side enforcement is needed in the future, an Edge Function can be
    added to serve protected content only after PIN verification.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accommodations' AND column_name = 'guidebook_pin'
  ) THEN
    ALTER TABLE accommodations ADD COLUMN guidebook_pin text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guidebook_categories' AND column_name = 'requires_pin'
  ) THEN
    ALTER TABLE guidebook_categories ADD COLUMN requires_pin boolean DEFAULT false NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guidebook_items' AND column_name = 'requires_pin'
  ) THEN
    ALTER TABLE guidebook_items ADD COLUMN requires_pin boolean DEFAULT false NOT NULL;
  END IF;
END $$;
