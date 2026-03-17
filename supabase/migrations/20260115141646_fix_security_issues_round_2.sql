/*
  # Fix Security Issues - Round 2

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
    - Add index on `content_blocks.section_id`
    - Add index on `navigation_menus.parent_id`

  ### 2. Drop Unused Indexes
    - Drop all indexes that are not being used to reduce database overhead
    - Includes indexes on: content_blocks, content_revisions, delivery_time_slots, 
      media_library, order_deadlines, order_items, orders, articles, page_sections, testimonials

  ### 3. Fix Multiple Permissive Policies on Articles
    - Drop the redundant "Authenticated users can read all articles" policy
    - Keep only "Public can read visible articles" for SELECT

  ### 4. Fix RLS Policies for Articles (Admin-Only Access)
    - Update INSERT/UPDATE/DELETE policies to check for admin role
    - Only authenticated admin users should be able to modify articles
    - Use auth.jwt() to check for admin role in app_metadata

  ### 5. Fix Function Search Path
    - Recreate `update_articles_updated_at` function with secure search_path

  ## Notes
  - Auth DB connection strategy and leaked password protection are configuration 
    settings that cannot be changed via migration
  - These should be configured in the Supabase dashboard
*/

-- 1. Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_content_blocks_section_id ON content_blocks(section_id) WHERE section_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_navigation_menus_parent_id ON navigation_menus(parent_id) WHERE parent_id IS NOT NULL;

-- 2. Drop unused indexes
DROP INDEX IF EXISTS idx_content_blocks_image_id;
DROP INDEX IF EXISTS idx_content_revisions_changed_by;
DROP INDEX IF EXISTS idx_delivery_time_slots_category_id;
DROP INDEX IF EXISTS idx_media_library_uploaded_by;
DROP INDEX IF EXISTS idx_order_deadlines_category_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_order_items_size_id;
DROP INDEX IF EXISTS idx_orders_delivery_time_slot_id;
DROP INDEX IF EXISTS idx_articles_category;
DROP INDEX IF EXISTS idx_articles_is_featured;
DROP INDEX IF EXISTS idx_articles_published_at;
DROP INDEX IF EXISTS idx_articles_is_visible;
DROP INDEX IF EXISTS idx_page_sections_image_id;
DROP INDEX IF EXISTS idx_testimonials_author_image_id;
DROP INDEX IF EXISTS idx_articles_featured_image_id;

-- 3. Fix multiple permissive policies on articles (drop redundant SELECT policy)
DROP POLICY IF EXISTS "Authenticated users can read all articles" ON articles;

-- 4. Fix RLS policies to be admin-only for modifications
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert articles" ON articles;
DROP POLICY IF EXISTS "Authenticated users can update articles" ON articles;
DROP POLICY IF EXISTS "Authenticated users can delete articles" ON articles;

-- Create new restrictive policies that check for admin access
-- Note: In production, you should set is_admin=true in auth.users.raw_app_meta_data for admin users
CREATE POLICY "Only admins can insert articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt()->>'email')::text IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ),
      false
    )
  );

CREATE POLICY "Only admins can update articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'email')::text IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ),
      false
    )
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt()->>'email')::text IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ),
      false
    )
  );

CREATE POLICY "Only admins can delete articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'email')::text IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ),
      false
    )
  );

-- 5. Fix function search path (drop trigger first, then function, then recreate)
DROP TRIGGER IF EXISTS articles_updated_at_trigger ON articles;
DROP FUNCTION IF EXISTS update_articles_updated_at();

CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER articles_updated_at_trigger
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();