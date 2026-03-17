/*
  # Fix Security Issues - Drop Unused Indexes and Restrict RLS Policies

  1. Drop Unused Indexes
    - idx_delivery_time_slots_category on delivery_time_slots
    - idx_order_deadlines_category on order_deadlines
    - idx_order_items_product on order_items
    - idx_order_items_size on order_items
    - idx_orders_delivery_slot on orders
    - idx_order_items_order_id on order_items

  2. Replace Overly Permissive RLS Policies
    - Remove policies that use USING (true) or WITH CHECK (true)
    - Replace with admin-only policies that check user role in app_metadata
    - Admin users must have app_metadata.role = 'admin'

  3. Tables Affected
    - categories: Restrict INSERT/UPDATE/DELETE to admin only
    - delivery_time_slots: Restrict INSERT/UPDATE/DELETE to admin only
    - order_deadlines: Restrict INSERT/UPDATE/DELETE to admin only
    - order_items: Restrict UPDATE/DELETE to admin only
    - orders: Restrict UPDATE/DELETE to admin only
    - product_sizes: Restrict INSERT/UPDATE/DELETE to admin only
    - products: Restrict INSERT/UPDATE/DELETE to admin only

  4. Security Model
    - Public users can read menu data (categories, products, product_sizes, delivery_time_slots)
    - Public users can create orders and order items
    - Only admin users can modify/delete data
    - Admin check uses: auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
*/

-- ============================================
-- STEP 1: Drop Unused Indexes
-- ============================================

DROP INDEX IF EXISTS idx_delivery_time_slots_category;
DROP INDEX IF EXISTS idx_order_deadlines_category;
DROP INDEX IF EXISTS idx_order_items_product;
DROP INDEX IF EXISTS idx_order_items_size;
DROP INDEX IF EXISTS idx_orders_delivery_slot;
DROP INDEX IF EXISTS idx_order_items_order_id;

-- ============================================
-- STEP 2: Create helper function for admin check
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ============================================
-- STEP 3: Fix categories RLS policies
-- ============================================

DROP POLICY IF EXISTS "Authenticated can insert categories" ON categories;
DROP POLICY IF EXISTS "Authenticated can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated can delete categories" ON categories;

CREATE POLICY "Admin can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- STEP 4: Fix delivery_time_slots RLS policies
-- ============================================

DROP POLICY IF EXISTS "Authenticated can insert delivery time slots" ON delivery_time_slots;
DROP POLICY IF EXISTS "Authenticated can update delivery time slots" ON delivery_time_slots;
DROP POLICY IF EXISTS "Authenticated can delete delivery time slots" ON delivery_time_slots;

CREATE POLICY "Admin can insert delivery time slots"
  ON delivery_time_slots FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update delivery time slots"
  ON delivery_time_slots FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete delivery time slots"
  ON delivery_time_slots FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- STEP 5: Fix order_deadlines RLS policies
-- ============================================

DROP POLICY IF EXISTS "Authenticated can insert order deadlines" ON order_deadlines;
DROP POLICY IF EXISTS "Authenticated can update order deadlines" ON order_deadlines;
DROP POLICY IF EXISTS "Authenticated can delete order deadlines" ON order_deadlines;

CREATE POLICY "Admin can insert order deadlines"
  ON order_deadlines FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update order deadlines"
  ON order_deadlines FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete order deadlines"
  ON order_deadlines FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- STEP 6: Fix order_items RLS policies
-- ============================================

DROP POLICY IF EXISTS "Authenticated can update order items" ON order_items;
DROP POLICY IF EXISTS "Authenticated can delete order items" ON order_items;

CREATE POLICY "Admin can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete order items"
  ON order_items FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- STEP 7: Fix orders RLS policies
-- ============================================

DROP POLICY IF EXISTS "Authenticated can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated can delete orders" ON orders;

CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- STEP 8: Fix product_sizes RLS policies
-- ============================================

DROP POLICY IF EXISTS "Authenticated can insert product sizes" ON product_sizes;
DROP POLICY IF EXISTS "Authenticated can update product sizes" ON product_sizes;
DROP POLICY IF EXISTS "Authenticated can delete product sizes" ON product_sizes;

CREATE POLICY "Admin can insert product sizes"
  ON product_sizes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update product sizes"
  ON product_sizes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete product sizes"
  ON product_sizes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- STEP 9: Fix products RLS policies
-- ============================================

DROP POLICY IF EXISTS "Authenticated can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated can update products" ON products;
DROP POLICY IF EXISTS "Authenticated can delete products" ON products;

CREATE POLICY "Admin can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (public.is_admin());
