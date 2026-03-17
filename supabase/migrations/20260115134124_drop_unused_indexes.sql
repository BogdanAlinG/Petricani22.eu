/*
  # Drop Unused Database Indexes

  1. Changes
    - Drop unused index `idx_delivery_time_slots_category_id` from `delivery_time_slots` table
    - Drop unused index `idx_order_deadlines_applies_to_category_id` from `order_deadlines` table
    - Drop unused index `idx_order_items_order_id` from `order_items` table
    - Drop unused index `idx_order_items_product_id` from `order_items` table
    - Drop unused index `idx_order_items_size_id` from `order_items` table
    - Drop unused index `idx_orders_delivery_time_slot_id` from `orders` table

  2. Notes
    - These indexes were identified as unused and are being removed to optimize database performance
    - Foreign key constraints remain in place for data integrity
*/

DROP INDEX IF EXISTS idx_delivery_time_slots_category_id;
DROP INDEX IF EXISTS idx_order_deadlines_applies_to_category_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_order_items_size_id;
DROP INDEX IF EXISTS idx_orders_delivery_time_slot_id;
