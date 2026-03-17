/*
  # Add Ingredients Columns to Products Table

  1. Schema Changes
    - Add `ingredients_en` (text) column for English ingredients
    - Add `ingredients_ro` (text) column for Romanian ingredients
    
  2. Purpose
    - Store product ingredients separately from full description
    - Support bilingual ingredient display
    - Ingredients are stored as comma-separated text to preserve size-specific formatting
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'ingredients_en'
  ) THEN
    ALTER TABLE products ADD COLUMN ingredients_en text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'ingredients_ro'
  ) THEN
    ALTER TABLE products ADD COLUMN ingredients_ro text DEFAULT '';
  END IF;
END $$;
