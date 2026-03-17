/*
  # Create Articles Table for Inspiration Content

  1. New Tables
    - `articles`
      - `id` (text, primary key) - URL-friendly slug identifier
      - `title_ro` (text, required) - Romanian title
      - `title_en` (text, required) - English title
      - `excerpt_ro` (text, required) - Romanian excerpt/summary
      - `excerpt_en` (text, required) - English excerpt/summary
      - `content_ro` (text, required) - Romanian full content (HTML)
      - `content_en` (text, required) - English full content (HTML)
      - `category` (text, required) - Article category
      - `featured_image_id` (uuid, nullable) - Reference to media library
      - `read_time_ro` (text, required) - Romanian read time display
      - `read_time_en` (text, required) - English read time display
      - `published_at` (date, required) - Publication date
      - `is_featured` (boolean, default false) - Whether article is featured
      - `is_visible` (boolean, default true) - Whether article is visible on frontend
      - `tags` (text array) - Article tags for categorization
      - `display_order` (integer, default 0) - Sort order
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `articles` table
    - Add policy for public read access to visible articles
    - Add policy for authenticated users to manage all articles

  3. Indexes
    - Index on category for filtering
    - Index on is_featured for featured article queries
    - Index on published_at for chronological sorting
    - Index on is_visible for public queries
    - Foreign key index on featured_image_id
*/

CREATE TABLE IF NOT EXISTS articles (
  id text PRIMARY KEY,
  title_ro text NOT NULL,
  title_en text NOT NULL,
  excerpt_ro text NOT NULL,
  excerpt_en text NOT NULL,
  content_ro text NOT NULL,
  content_en text NOT NULL,
  category text NOT NULL,
  featured_image_id uuid REFERENCES media_library(id) ON DELETE SET NULL,
  read_time_ro text NOT NULL DEFAULT '5 min',
  read_time_en text NOT NULL DEFAULT '5 min',
  published_at date NOT NULL DEFAULT CURRENT_DATE,
  is_featured boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible articles"
  ON articles
  FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

CREATE POLICY "Authenticated users can read all articles"
  ON articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_visible ON articles(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_articles_featured_image_id ON articles(featured_image_id) WHERE featured_image_id IS NOT NULL;

CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER articles_updated_at_trigger
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();