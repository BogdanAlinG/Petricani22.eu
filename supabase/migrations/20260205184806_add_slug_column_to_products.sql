/*
  # Add slug column to products table

  1. Changes
    - Add `slug` (text, unique, not null) column to `products` table
    - Populate slugs for all existing products based on their English title
    - Create a trigger function to auto-generate slugs on insert/update
    - Add unique index on slug for fast lookups

  2. Slug Generation
    - Converts title_en to lowercase
    - Replaces non-alphanumeric characters with hyphens
    - Removes leading/trailing hyphens
    - Appends a numeric suffix if duplicate slug exists
*/

CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.title_en IS DISTINCT FROM NEW.title_en AND (NEW.slug = OLD.slug OR NEW.slug IS NULL OR NEW.slug = '')) THEN
    base_slug := lower(trim(NEW.title_en));
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');

    final_slug := base_slug;

    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM products WHERE slug = final_slug AND id != NEW.id
      ) THEN
        EXIT;
      END IF;
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'slug'
  ) THEN
    ALTER TABLE products ADD COLUMN slug text;
  END IF;
END $$;

DO $$
DECLARE
  r record;
  base_slug text;
  final_slug text;
  counter integer;
BEGIN
  FOR r IN SELECT id, title_en FROM products WHERE slug IS NULL OR slug = '' ORDER BY created_at
  LOOP
    base_slug := lower(trim(r.title_en));
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');

    final_slug := base_slug;
    counter := 0;

    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM products WHERE slug = final_slug AND id != r.id
      ) THEN
        EXIT;
      END IF;
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    UPDATE products SET slug = final_slug WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE products ALTER COLUMN slug SET NOT NULL;
ALTER TABLE products ALTER COLUMN slug SET DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_slug_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_products_slug_unique ON products (slug);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trigger_generate_product_slug ON products;
CREATE TRIGGER trigger_generate_product_slug
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_slug();
