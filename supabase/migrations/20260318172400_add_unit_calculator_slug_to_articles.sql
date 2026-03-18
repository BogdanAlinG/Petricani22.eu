-- Add unit_calculator_slug column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS unit_calculator_slug text REFERENCES rental_options(slug);
