/*
  # Add Missing Foreign Key Indexes
  
  ## Overview
  This migration adds indexes for all foreign key columns to improve query performance,
  particularly for JOINs and foreign key constraint checks.
  
  ## Performance Improvements
  
  ### 1. New Indexes Added
  - `idx_delivery_time_slots_category` - Index on delivery_time_slots.category_id
  - `idx_order_deadlines_category` - Index on order_deadlines.applies_to_category_id
  - `idx_order_items_product` - Index on order_items.product_id
  - `idx_order_items_size` - Index on order_items.size_id
  - `idx_orders_delivery_slot` - Index on orders.delivery_time_slot_id
  
  ### 2. Benefits
  - Faster JOIN operations when querying related tables
  - Improved performance for foreign key constraint validation
  - Better query optimization by the database planner
  - Reduced table scan overhead
  
  ## Note on "Unused Index" Warning
  The `idx_order_items_order_id` index showing as "unused" is expected for new databases.
  Foreign key indexes are critical for performance even if they haven't been used yet.
  They will be utilized as soon as queries join these tables or check referential integrity.
  
  ## Outstanding Security Concerns
  
  ### Auth DB Connection Strategy
  CANNOT BE FIXED VIA MIGRATION - This is a Supabase project configuration setting.
  Action Required: Go to Supabase Dashboard > Project Settings > Database > Connection Pooling
  Change from fixed connection count to percentage-based allocation.
  
  ### RLS Policy Security Model
  The current RLS policies use `USING (true)` for authenticated users, which is flagged
  as a security concern. This design assumes:
  
  - Authenticated users = Staff/Administrators with full system access
  - Public users = Guests who can view catalog and place orders
  
  IMPORTANT CONSIDERATION:
  If your application allows regular customers to create accounts and authenticate,
  the current policies would give them admin-level access. In that case, you need
  role-based access control:
  
  1. Add an admin role check to management policies
  2. Restrict authenticated users to only view/modify their own orders
  3. Use app_metadata to store and check user roles
  
  Example of proper role-based policy:
  
  ```sql
  CREATE POLICY "Only admins can delete products"
    ON products FOR DELETE
    TO authenticated
    USING (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );
  ```
  
  If authenticated users are ONLY staff members, the current policies are acceptable.
*/

-- ============================================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Index for delivery_time_slots.category_id foreign key
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_category 
  ON delivery_time_slots(category_id);

-- Index for order_deadlines.applies_to_category_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_deadlines_category 
  ON order_deadlines(applies_to_category_id);

-- Index for order_items.product_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_product 
  ON order_items(product_id);

-- Index for order_items.size_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_size 
  ON order_items(size_id);

-- Index for orders.delivery_time_slot_id foreign key
CREATE INDEX IF NOT EXISTS idx_orders_delivery_slot 
  ON orders(delivery_time_slot_id);

-- ============================================================================
-- PERFORMANCE VERIFICATION QUERIES (FOR DOCUMENTATION ONLY - NOT EXECUTED)
-- ============================================================================

/*
These indexes will improve performance for queries like:

-- Get all products in a category
SELECT p.* FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'breakfast';

-- Get order details with items
SELECT o.*, oi.*, p.title_en 
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.order_number = 'ORD-12345';

-- Get delivery slots for a specific category
SELECT * FROM delivery_time_slots
WHERE category_id = '...' AND is_active = true;

-- Get deadlines for a category
SELECT * FROM order_deadlines
WHERE applies_to_category_id = '...'
ORDER BY day_of_week, cutoff_time;
*/
