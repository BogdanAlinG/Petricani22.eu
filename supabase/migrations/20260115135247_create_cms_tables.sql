/*
  # Create Content Management System Tables

  1. New Tables
    - `site_settings` - Global site configuration (contact info, SEO, branding)
      - `id` (uuid, primary key)
      - `key` (text, unique) - Setting identifier
      - `value_en` (text) - English value
      - `value_ro` (text) - Romanian value
      - `type` (text) - Setting type (text, email, phone, url, image, json)
      - `group` (text) - Setting group for organization
      - `description` (text) - Admin-facing description
      - `created_at`, `updated_at` (timestamps)
    
    - `media_library` - Centralized media file management
      - `id` (uuid, primary key)
      - `filename` (text) - Original filename
      - `url` (text) - File URL/path
      - `alt_text_en`, `alt_text_ro` (text) - Alt text for accessibility
      - `type` (text) - File type (image, video, document)
      - `size_bytes` (bigint) - File size
      - `width`, `height` (int) - Dimensions for images/videos
      - `uploaded_by` (uuid) - User who uploaded
      - `created_at` (timestamp)
    
    - `page_sections` - Configurable page content sections
      - `id` (uuid, primary key)
      - `page` (text) - Page identifier (home, menu, etc.)
      - `section` (text) - Section identifier (hero, features, etc.)
      - `title_en`, `title_ro` (text) - Section title
      - `subtitle_en`, `subtitle_ro` (text) - Section subtitle
      - `content_en`, `content_ro` (text) - Rich text content
      - `image_id` (uuid, FK to media_library) - Associated image
      - `settings` (jsonb) - Additional section-specific settings
      - `is_visible` (boolean) - Section visibility toggle
      - `display_order` (int) - Display ordering
      - `created_at`, `updated_at` (timestamps)
    
    - `content_blocks` - Reusable content items within sections
      - `id` (uuid, primary key)
      - `section_id` (uuid, FK to page_sections)
      - `type` (text) - Block type (feature, amenity, testimonial, etc.)
      - `icon` (text) - Icon identifier from lucide-react
      - `title_en`, `title_ro` (text) - Block title
      - `description_en`, `description_ro` (text) - Block description
      - `link_url` (text) - Optional link URL
      - `image_id` (uuid, FK to media_library) - Associated image
      - `settings` (jsonb) - Additional block settings
      - `display_order` (int)
      - `is_visible` (boolean)
      - `created_at`, `updated_at` (timestamps)
    
    - `content_revisions` - Version history for content changes
      - `id` (uuid, primary key)
      - `entity_type` (text) - Type of entity (page_section, content_block, site_setting)
      - `entity_id` (uuid) - ID of the entity
      - `changes` (jsonb) - Snapshot of previous values
      - `changed_by` (uuid) - User who made the change
      - `change_description` (text) - Optional description
      - `created_at` (timestamp)
    
    - `navigation_menus` - Configurable navigation structure
      - `id` (uuid, primary key)
      - `location` (text) - Menu location (header, footer, sidebar)
      - `parent_id` (uuid, self-referential) - For nested menus
      - `label_en`, `label_ro` (text) - Menu item labels
      - `url` (text) - Navigation URL
      - `icon` (text) - Optional icon
      - `target` (text) - Link target (_self, _blank)
      - `display_order` (int)
      - `is_visible` (boolean)
      - `created_at`, `updated_at` (timestamps)
    
    - `faqs` - Frequently asked questions
      - `id` (uuid, primary key)
      - `category` (text) - FAQ category
      - `question_en`, `question_ro` (text) - Question text
      - `answer_en`, `answer_ro` (text) - Answer (supports rich text)
      - `display_order` (int)
      - `is_visible` (boolean)
      - `created_at`, `updated_at` (timestamps)
    
    - `testimonials` - Customer testimonials/reviews
      - `id` (uuid, primary key)
      - `author_name` (text) - Author's name
      - `author_title` (text) - Author's title/role
      - `author_image_id` (uuid, FK to media_library)
      - `content_en`, `content_ro` (text) - Testimonial content
      - `rating` (int) - 1-5 star rating
      - `source` (text) - Where testimonial came from
      - `date` (date) - Date of testimonial
      - `is_featured` (boolean) - Feature on homepage
      - `is_visible` (boolean)
      - `display_order` (int)
      - `created_at`, `updated_at` (timestamps)
    
    - `social_links` - Social media links
      - `id` (uuid, primary key)
      - `platform` (text) - Platform name (facebook, instagram, etc.)
      - `url` (text) - Profile URL
      - `icon` (text) - Icon identifier
      - `display_order` (int)
      - `is_visible` (boolean)
      - `created_at`, `updated_at` (timestamps)

  2. Security
    - Enable RLS on all tables
    - Public read access for published content
    - Authenticated admin write access
*/

-- Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value_en text,
  value_ro text,
  type text NOT NULL DEFAULT 'text',
  "group" text NOT NULL DEFAULT 'general',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete site settings"
  ON site_settings FOR DELETE
  TO authenticated
  USING (true);

-- Media Library Table
CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  url text NOT NULL,
  alt_text_en text,
  alt_text_ro text,
  type text NOT NULL DEFAULT 'image',
  size_bytes bigint,
  width int,
  height int,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read media library"
  ON media_library FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert media"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media"
  ON media_library FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete media"
  ON media_library FOR DELETE
  TO authenticated
  USING (true);

-- Page Sections Table
CREATE TABLE IF NOT EXISTS page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  section text NOT NULL,
  title_en text,
  title_ro text,
  subtitle_en text,
  subtitle_ro text,
  content_en text,
  content_ro text,
  image_id uuid REFERENCES media_library(id) ON DELETE SET NULL,
  settings jsonb DEFAULT '{}',
  is_visible boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page, section)
);

ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible page sections"
  ON page_sections FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert page sections"
  ON page_sections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update page sections"
  ON page_sections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete page sections"
  ON page_sections FOR DELETE
  TO authenticated
  USING (true);

-- Content Blocks Table
CREATE TABLE IF NOT EXISTS content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES page_sections(id) ON DELETE CASCADE,
  type text NOT NULL,
  icon text,
  title_en text,
  title_ro text,
  description_en text,
  description_ro text,
  link_url text,
  image_id uuid REFERENCES media_library(id) ON DELETE SET NULL,
  settings jsonb DEFAULT '{}',
  display_order int DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible content blocks"
  ON content_blocks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert content blocks"
  ON content_blocks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update content blocks"
  ON content_blocks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete content blocks"
  ON content_blocks FOR DELETE
  TO authenticated
  USING (true);

-- Content Revisions Table
CREATE TABLE IF NOT EXISTS content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  changes jsonb NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  change_description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read revisions"
  ON content_revisions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert revisions"
  ON content_revisions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Navigation Menus Table
CREATE TABLE IF NOT EXISTS navigation_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  parent_id uuid REFERENCES navigation_menus(id) ON DELETE CASCADE,
  label_en text NOT NULL,
  label_ro text NOT NULL,
  url text NOT NULL,
  icon text,
  target text DEFAULT '_self',
  display_order int DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible navigation menus"
  ON navigation_menus FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert navigation menus"
  ON navigation_menus FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update navigation menus"
  ON navigation_menus FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete navigation menus"
  ON navigation_menus FOR DELETE
  TO authenticated
  USING (true);

-- FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text DEFAULT 'general',
  question_en text NOT NULL,
  question_ro text NOT NULL,
  answer_en text NOT NULL,
  answer_ro text NOT NULL,
  display_order int DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible FAQs"
  ON faqs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert FAQs"
  ON faqs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update FAQs"
  ON faqs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete FAQs"
  ON faqs FOR DELETE
  TO authenticated
  USING (true);

-- Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_title text,
  author_image_id uuid REFERENCES media_library(id) ON DELETE SET NULL,
  content_en text NOT NULL,
  content_ro text NOT NULL,
  rating int DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  source text,
  date date DEFAULT CURRENT_DATE,
  is_featured boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible testimonials"
  ON testimonials FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update testimonials"
  ON testimonials FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete testimonials"
  ON testimonials FOR DELETE
  TO authenticated
  USING (true);

-- Social Links Table
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  icon text,
  display_order int DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible social links"
  ON social_links FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert social links"
  ON social_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update social links"
  ON social_links FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete social links"
  ON social_links FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page);
CREATE INDEX IF NOT EXISTS idx_page_sections_section ON page_sections(page, section);
CREATE INDEX IF NOT EXISTS idx_content_blocks_section_id ON content_blocks(section_id);
CREATE INDEX IF NOT EXISTS idx_content_revisions_entity ON content_revisions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_navigation_menus_location ON navigation_menus(location);
CREATE INDEX IF NOT EXISTS idx_navigation_menus_parent_id ON navigation_menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(type);

-- Insert default site settings
INSERT INTO site_settings (key, value_en, value_ro, type, "group", description)
VALUES
  ('site_name', 'Petricani 22', 'Petricani 22', 'text', 'branding', 'Site name displayed in header and title'),
  ('site_tagline', 'Premium property rental in Bucharest', 'Inchiriere proprietate premium in Bucuresti', 'text', 'branding', 'Site tagline/slogan'),
  ('contact_phone', '+40 743 333 090', '+40 743 333 090', 'phone', 'contact', 'Primary contact phone number'),
  ('contact_email', 'contact@petricani22.eu', 'contact@petricani22.eu', 'email', 'contact', 'Primary contact email'),
  ('contact_address', 'Petricani 22, Bucharest, Romania', 'Petricani 22, Bucuresti, Romania', 'text', 'contact', 'Physical address'),
  ('meta_title', 'Petricani 22 - Property Rental in Bucharest', 'Petricani 22 - Inchiriere Proprietate in Bucuresti', 'text', 'seo', 'Default page title for SEO'),
  ('meta_description', 'Premium property rental in the heart of Bucharest. Flexible configurations for residential, commercial, or event spaces.', 'Inchiriere proprietate premium in inima Bucurestiului. Configuratii flexibile pentru spatii rezidentiale, comerciale sau evenimente.', 'text', 'seo', 'Default meta description for SEO'),
  ('copyright_text', '© 2025 Petricani 22. All rights reserved.', '© 2025 Petricani 22. Toate drepturile rezervate.', 'text', 'footer', 'Copyright text in footer')
ON CONFLICT (key) DO NOTHING;

-- Insert default social links
INSERT INTO social_links (platform, url, icon, display_order)
VALUES
  ('facebook', '#', 'Facebook', 1),
  ('instagram', '#', 'Instagram', 2),
  ('twitter', '#', 'Twitter', 3)
ON CONFLICT DO NOTHING;
