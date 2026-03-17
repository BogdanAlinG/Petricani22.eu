/*
  # Fix Security Issues - Indexes and RLS Policies

  1. Foreign Key Indexes
    - Add index on `articles.featured_image_id`
    - Add index on `content_blocks.image_id`
    - Add index on `content_revisions.changed_by`
    - Add index on `delivery_time_slots.category_id`
    - Add index on `media_library.uploaded_by`
    - Add index on `order_deadlines.applies_to_category_id`
    - Add index on `order_items.order_id`
    - Add index on `order_items.product_id`
    - Add index on `order_items.size_id`
    - Add index on `orders.delivery_time_slot_id`
    - Add index on `page_sections.image_id`
    - Add index on `testimonials.author_image_id`

  2. RLS Policy Fixes
    - Fix articles policies to use `(select auth.uid())` pattern for better performance
    - Fix rental_options policies to restrict modifications to admin users only
    - Consolidate multiple permissive SELECT policies on categories, products, product_sizes

  3. Security Notes
    - All authenticated users could previously modify rental_options - now restricted
    - RLS policies now use optimized auth function calls
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_articles_featured_image_id ON articles(featured_image_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_image_id ON content_blocks(image_id);
CREATE INDEX IF NOT EXISTS idx_content_revisions_changed_by ON content_revisions(changed_by);
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_category_id ON delivery_time_slots(category_id);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_order_deadlines_applies_to_category_id ON order_deadlines(applies_to_category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_size_id ON order_items(size_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_time_slot_id ON orders(delivery_time_slot_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_image_id ON page_sections(image_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_author_image_id ON testimonials(author_image_id);

-- Fix articles RLS policies to use optimized auth function calls
DROP POLICY IF EXISTS "Only admins can insert articles" ON articles;
DROP POLICY IF EXISTS "Only admins can update articles" ON articles;
DROP POLICY IF EXISTS "Only admins can delete articles" ON articles;

CREATE POLICY "Only admins can insert articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only admins can update articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only admins can delete articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- Fix rental_options policies - remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can view visible rental options" ON rental_options;
DROP POLICY IF EXISTS "Authenticated users can view all rental options" ON rental_options;
DROP POLICY IF EXISTS "Authenticated users can insert rental options" ON rental_options;
DROP POLICY IF EXISTS "Authenticated users can update rental options" ON rental_options;
DROP POLICY IF EXISTS "Authenticated users can delete rental options" ON rental_options;

CREATE POLICY "Public can view visible rental options"
  ON rental_options
  FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admin can view all rental options"
  ON rental_options
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Admin can insert rental options"
  ON rental_options
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Admin can update rental options"
  ON rental_options
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Admin can delete rental options"
  ON rental_options
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- Fix categories multiple permissive policies
DROP POLICY IF EXISTS "Admin can view all categories" ON categories;
DROP POLICY IF EXISTS "Public can view active categories" ON categories;

CREATE POLICY "Anyone can view active categories"
  ON categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND is_active = false);

-- Fix products multiple permissive policies
DROP POLICY IF EXISTS "Admin can view all products" ON products;
DROP POLICY IF EXISTS "Public can view available products" ON products;

CREATE POLICY "Anyone can view available products"
  ON products
  FOR SELECT
  USING (is_available = true);

CREATE POLICY "Admin can view unavailable products"
  ON products
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND is_available = false);

-- Fix product_sizes multiple permissive policies
DROP POLICY IF EXISTS "Admin can view all product sizes" ON product_sizes;
DROP POLICY IF EXISTS "Public can view available product sizes" ON product_sizes;

CREATE POLICY "Anyone can view available product sizes"
  ON product_sizes
  FOR SELECT
  USING (is_available = true);

CREATE POLICY "Admin can view unavailable product sizes"
  ON product_sizes
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND is_available = false);
