/*
  # Fix Security Issues - Drop Unused Indexes and Fix RLS Policies

  1. Dropped Indexes (unused)
    - idx_rental_options_is_visible
    - idx_articles_featured_image_id
    - idx_content_blocks_image_id
    - idx_content_revisions_changed_by
    - idx_delivery_time_slots_category_id
    - idx_media_library_uploaded_by
    - idx_order_deadlines_applies_to_category_id
    - idx_order_items_order_id
    - idx_order_items_product_id
    - idx_order_items_size_id
    - idx_orders_delivery_time_slot_id
    - idx_page_sections_image_id
    - idx_testimonials_author_image_id
    - idx_media_library_folder
    - idx_sync_logs_configuration
    - idx_sync_logs_status
    - idx_synced_products_product
    - idx_synced_products_source
    - idx_navigation_menus_parent_id

  2. RLS Policy Fixes
    - Consolidated multiple permissive SELECT policies on categories, products, 
      product_sizes, and rental_options into single policies with OR conditions
    - Removed overly permissive write policies on sync tables (service role bypasses RLS)
    - Kept read-only access for authenticated users on sync tables

  3. Security Improvements
    - Sync table modifications now require service role (used by Edge Functions)
    - Regular authenticated users can only view sync data, not modify it
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_rental_options_is_visible;
DROP INDEX IF EXISTS idx_articles_featured_image_id;
DROP INDEX IF EXISTS idx_content_blocks_image_id;
DROP INDEX IF EXISTS idx_content_revisions_changed_by;
DROP INDEX IF EXISTS idx_delivery_time_slots_category_id;
DROP INDEX IF EXISTS idx_media_library_uploaded_by;
DROP INDEX IF EXISTS idx_order_deadlines_applies_to_category_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_order_items_size_id;
DROP INDEX IF EXISTS idx_orders_delivery_time_slot_id;
DROP INDEX IF EXISTS idx_page_sections_image_id;
DROP INDEX IF EXISTS idx_testimonials_author_image_id;
DROP INDEX IF EXISTS idx_media_library_folder;
DROP INDEX IF EXISTS idx_sync_logs_configuration;
DROP INDEX IF EXISTS idx_sync_logs_status;
DROP INDEX IF EXISTS idx_synced_products_product;
DROP INDEX IF EXISTS idx_synced_products_source;
DROP INDEX IF EXISTS idx_navigation_menus_parent_id;

-- Fix categories: consolidate multiple SELECT policies
DROP POLICY IF EXISTS "Admin can view all categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;

CREATE POLICY "Authenticated users can view all categories, public sees active only"
  ON categories FOR SELECT
  USING (
    is_active = true 
    OR auth.uid() IS NOT NULL
  );

-- Fix products: consolidate multiple SELECT policies  
DROP POLICY IF EXISTS "Admin can view unavailable products" ON products;
DROP POLICY IF EXISTS "Anyone can view available products" ON products;

CREATE POLICY "Authenticated users can view all products, public sees available only"
  ON products FOR SELECT
  USING (
    is_available = true 
    OR auth.uid() IS NOT NULL
  );

-- Fix product_sizes: consolidate multiple SELECT policies
DROP POLICY IF EXISTS "Admin can view unavailable product sizes" ON product_sizes;
DROP POLICY IF EXISTS "Anyone can view available product sizes" ON product_sizes;

CREATE POLICY "Authenticated users can view all sizes, public sees available only"
  ON product_sizes FOR SELECT
  USING (
    is_available = true 
    OR auth.uid() IS NOT NULL
  );

-- Fix rental_options: consolidate multiple SELECT policies
DROP POLICY IF EXISTS "Admin can view all rental options" ON rental_options;
DROP POLICY IF EXISTS "Public can view visible rental options" ON rental_options;

CREATE POLICY "Authenticated users can view all options, public sees visible only"
  ON rental_options FOR SELECT
  USING (
    is_visible = true 
    OR auth.uid() IS NOT NULL
  );

-- Fix sync_configurations: remove overly permissive write policies
-- Service role (used by Edge Functions) bypasses RLS, so we don't need write policies
DROP POLICY IF EXISTS "Authenticated users can insert sync configurations" ON sync_configurations;
DROP POLICY IF EXISTS "Authenticated users can update sync configurations" ON sync_configurations;
DROP POLICY IF EXISTS "Authenticated users can delete sync configurations" ON sync_configurations;
DROP POLICY IF EXISTS "Authenticated users can view sync configurations" ON sync_configurations;

-- Only allow authenticated users to read sync configurations
CREATE POLICY "Authenticated users can view sync configurations"
  ON sync_configurations FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix sync_logs: remove overly permissive write policies
DROP POLICY IF EXISTS "Authenticated users can insert sync logs" ON sync_logs;
DROP POLICY IF EXISTS "Authenticated users can update sync logs" ON sync_logs;
DROP POLICY IF EXISTS "Authenticated users can view sync logs" ON sync_logs;

-- Only allow authenticated users to read sync logs
CREATE POLICY "Authenticated users can view sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix synced_products: remove overly permissive write policies
DROP POLICY IF EXISTS "Authenticated users can insert synced products" ON synced_products;
DROP POLICY IF EXISTS "Authenticated users can update synced products" ON synced_products;
DROP POLICY IF EXISTS "Authenticated users can delete synced products" ON synced_products;
DROP POLICY IF EXISTS "Authenticated users can view synced products" ON synced_products;

-- Only allow authenticated users to read synced products
CREATE POLICY "Authenticated users can view synced products"
  ON synced_products FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);