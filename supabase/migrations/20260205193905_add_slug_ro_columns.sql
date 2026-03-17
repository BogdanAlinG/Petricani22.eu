/*
  # Add Romanian slug columns for bilingual URL support

  1. Modified Tables
    - `accommodations`
      - Add `slug_ro` (text, nullable) for Romanian URL slugs
      - Add unique constraint on `slug_ro`
      - Backfill `slug_ro` with existing `slug` values
    - `categories`
      - Add `slug_ro` (text, nullable) for Romanian URL slugs
      - Add unique constraint on `slug_ro`
      - Backfill `slug_ro` with existing `slug` values
    - `products`
      - Add `slug_ro` (text, nullable) for Romanian URL slugs
      - Add unique constraint on `slug_ro`
      - Backfill `slug_ro` with existing `slug` values

  2. Important Notes
    - Existing `slug` column is kept as-is (serves as English slug)
    - `slug_ro` is backfilled with the current `slug` value so existing URLs continue to work
    - Admins can then update `slug_ro` with proper Romanian translations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accommodations' AND column_name = 'slug_ro'
  ) THEN
    ALTER TABLE accommodations ADD COLUMN slug_ro text;
  END IF;
END $$;

UPDATE accommodations SET slug_ro = slug WHERE slug_ro IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accommodations_slug_ro_key'
  ) THEN
    ALTER TABLE accommodations ADD CONSTRAINT accommodations_slug_ro_key UNIQUE (slug_ro);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'slug_ro'
  ) THEN
    ALTER TABLE categories ADD COLUMN slug_ro text;
  END IF;
END $$;

UPDATE categories SET slug_ro = slug WHERE slug_ro IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_ro_key'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_slug_ro_key UNIQUE (slug_ro);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'slug_ro'
  ) THEN
    ALTER TABLE products ADD COLUMN slug_ro text;
  END IF;
END $$;

UPDATE products SET slug_ro = slug WHERE slug_ro IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_ro_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_slug_ro_key UNIQUE (slug_ro);
  END IF;
END $$;
