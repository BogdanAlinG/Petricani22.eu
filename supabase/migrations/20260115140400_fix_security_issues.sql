/*
  # Fix Security Issues

  1. Add Missing Foreign Key Indexes
    - content_blocks.image_id
    - content_revisions.changed_by
    - delivery_time_slots.category_id
    - media_library.uploaded_by
    - order_deadlines.applies_to_category_id
    - order_items.order_id, product_id, size_id
    - orders.delivery_time_slot_id
    - page_sections.image_id
    - testimonials.author_image_id

  2. Drop Unused Indexes
    - idx_page_sections_page
    - idx_page_sections_section
    - idx_content_blocks_section_id
    - idx_content_revisions_entity
    - idx_navigation_menus_location
    - idx_navigation_menus_parent_id
    - idx_faqs_category
    - idx_testimonials_featured
    - idx_media_library_type

  3. Update RLS Policies
    - Create is_admin helper function
    - Replace overly permissive policies with admin-only access
*/

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_app_meta_data->>'role' = 'admin'
      OR raw_app_meta_data->>'is_admin' = 'true'
      OR email LIKE '%@petricani22.eu'
    )
  );
$$;

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_content_blocks_image_id ON content_blocks(image_id);
CREATE INDEX IF NOT EXISTS idx_content_revisions_changed_by ON content_revisions(changed_by);
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_category_id ON delivery_time_slots(category_id);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_order_deadlines_category_id ON order_deadlines(applies_to_category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_size_id ON order_items(size_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_time_slot_id ON orders(delivery_time_slot_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_image_id ON page_sections(image_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_author_image_id ON testimonials(author_image_id);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_page_sections_page;
DROP INDEX IF EXISTS idx_page_sections_section;
DROP INDEX IF EXISTS idx_content_blocks_section_id;
DROP INDEX IF EXISTS idx_content_revisions_entity;
DROP INDEX IF EXISTS idx_navigation_menus_location;
DROP INDEX IF EXISTS idx_navigation_menus_parent_id;
DROP INDEX IF EXISTS idx_faqs_category;
DROP INDEX IF EXISTS idx_testimonials_featured;
DROP INDEX IF EXISTS idx_media_library_type;

-- Update RLS policies for site_settings
DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can delete site settings" ON site_settings;

CREATE POLICY "Admins can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete site settings"
  ON site_settings FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update RLS policies for media_library
DROP POLICY IF EXISTS "Authenticated users can insert media" ON media_library;
DROP POLICY IF EXISTS "Authenticated users can update media" ON media_library;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON media_library;

CREATE POLICY "Admins can insert media"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update media"
  ON media_library FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete media"
  ON media_library FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update RLS policies for page_sections
DROP POLICY IF EXISTS "Authenticated users can insert page sections" ON page_sections;
DROP POLICY IF EXISTS "Authenticated users can update page sections" ON page_sections;
DROP POLICY IF EXISTS "Authenticated users can delete page sections" ON page_sections;

CREATE POLICY "Admins can insert page sections"
  ON page_sections FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update page sections"
  ON page_sections FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete page sections"
  ON page_sections FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update RLS policies for content_blocks
DROP POLICY IF EXISTS "Authenticated users can insert content blocks" ON content_blocks;
DROP POLICY IF EXISTS "Authenticated users can update content blocks" ON content_blocks;
DROP POLICY IF EXISTS "Authenticated users can delete content blocks" ON content_blocks;

CREATE POLICY "Admins can insert content blocks"
  ON content_blocks FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update content blocks"
  ON content_blocks FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete content blocks"
  ON content_blocks FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update RLS policies for content_revisions
DROP POLICY IF EXISTS "Authenticated users can insert revisions" ON content_revisions;

CREATE POLICY "Admins can insert revisions"
  ON content_revisions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Update RLS policies for navigation_menus
DROP POLICY IF EXISTS "Authenticated users can insert navigation menus" ON navigation_menus;
DROP POLICY IF EXISTS "Authenticated users can update navigation menus" ON navigation_menus;
DROP POLICY IF EXISTS "Authenticated users can delete navigation menus" ON navigation_menus;

CREATE POLICY "Admins can insert navigation menus"
  ON navigation_menus FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update navigation menus"
  ON navigation_menus FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete navigation menus"
  ON navigation_menus FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update RLS policies for faqs
DROP POLICY IF EXISTS "Authenticated users can insert FAQs" ON faqs;
DROP POLICY IF EXISTS "Authenticated users can update FAQs" ON faqs;
DROP POLICY IF EXISTS "Authenticated users can delete FAQs" ON faqs;

CREATE POLICY "Admins can insert FAQs"
  ON faqs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update FAQs"
  ON faqs FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete FAQs"
  ON faqs FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update RLS policies for testimonials
DROP POLICY IF EXISTS "Authenticated users can insert testimonials" ON testimonials;
DROP POLICY IF EXISTS "Authenticated users can update testimonials" ON testimonials;
DROP POLICY IF EXISTS "Authenticated users can delete testimonials" ON testimonials;

CREATE POLICY "Admins can insert testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update testimonials"
  ON testimonials FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete testimonials"
  ON testimonials FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update RLS policies for social_links
DROP POLICY IF EXISTS "Authenticated users can insert social links" ON social_links;
DROP POLICY IF EXISTS "Authenticated users can update social links" ON social_links;
DROP POLICY IF EXISTS "Authenticated users can delete social links" ON social_links;

CREATE POLICY "Admins can insert social links"
  ON social_links FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update social links"
  ON social_links FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete social links"
  ON social_links FOR DELETE
  TO authenticated
  USING (is_admin());
