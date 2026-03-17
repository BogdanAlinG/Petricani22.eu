/*
  # Add Foreign Key Indexes and Fix Function Search Path

  1. Add Missing Foreign Key Indexes
    - delivery_time_slots.category_id
    - order_deadlines.applies_to_category_id
    - order_items.order_id
    - order_items.product_id
    - order_items.size_id
    - orders.delivery_time_slot_id

  2. Fix Function Search Path
    - Recreate is_admin() function with immutable search_path
    - Set search_path to empty string to prevent search path manipulation attacks

  3. Security Notes
    - Foreign key indexes improve JOIN performance and cascade operations
    - Fixed search_path prevents potential privilege escalation attacks
*/

-- ============================================
-- STEP 1: Add Foreign Key Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_category_id
  ON delivery_time_slots (category_id);

CREATE INDEX IF NOT EXISTS idx_order_deadlines_applies_to_category_id
  ON order_deadlines (applies_to_category_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_size_id
  ON order_items (size_id);

CREATE INDEX IF NOT EXISTS idx_orders_delivery_time_slot_id
  ON orders (delivery_time_slot_id);

-- ============================================
-- STEP 2: Fix is_admin Function Search Path
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;
