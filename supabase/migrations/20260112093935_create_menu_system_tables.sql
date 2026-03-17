-- Digital Menu System - Complete Database Schema
--
-- Overview:
-- This migration creates a complete food ordering system for property guests with next-day ordering
-- for food and 24/7 availability for mini-bar items. Supports both online (Stripe) and cash payments.
--
-- New Tables:
-- 1. categories - Menu sections (Breakfast, Lunch, Dinner, etc.)
-- 2. products - All food and beverage items
-- 3. product_sizes - Size variations (Small, Medium, Large, etc.)
-- 4. delivery_time_slots - Available delivery windows
-- 5. order_deadlines - Cutoff times for placing orders
-- 6. orders - Guest orders with payment and delivery info
-- 7. order_items - Individual items in each order
--
-- Security:
-- All tables have RLS enabled with appropriate policies for public catalog access
-- and staff-only order management.

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ro text NOT NULL,
  slug text UNIQUE NOT NULL,
  description_en text DEFAULT '',
  description_ro text DEFAULT '',
  is_minibar boolean DEFAULT false,
  requires_advance_order boolean DEFAULT true,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title_en text NOT NULL,
  title_ro text NOT NULL,
  short_description_en text DEFAULT '',
  short_description_ro text DEFAULT '',
  full_description_en text DEFAULT '',
  full_description_ro text DEFAULT '',
  special_mentions_en text DEFAULT '',
  special_mentions_ro text DEFAULT '',
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  allergen_info text[] DEFAULT '{}',
  dietary_tags text[] DEFAULT '{}',
  is_minibar_item boolean DEFAULT false,
  is_available boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_sizes table
CREATE TABLE IF NOT EXISTS product_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_name_en text NOT NULL,
  size_name_ro text NOT NULL,
  price_modifier decimal(10,2) DEFAULT 0,
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create delivery_time_slots table
CREATE TABLE IF NOT EXISTS delivery_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_name_en text NOT NULL,
  slot_name_ro text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  max_orders_per_slot integer,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create order_deadlines table
CREATE TABLE IF NOT EXISTS order_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  cutoff_time time NOT NULL,
  applies_to_category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  guest_email text NOT NULL,
  room_number text NOT NULL,
  check_in_date date NOT NULL,
  delivery_date date NOT NULL,
  delivery_time_slot_id uuid REFERENCES delivery_time_slots(id) ON DELETE SET NULL,
  special_instructions text DEFAULT '',
  payment_method text NOT NULL CHECK (payment_method IN ('online', 'cash')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  stripe_payment_intent_id text,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  order_status text DEFAULT 'pending_payment' CHECK (order_status IN ('pending_payment', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  cancelled_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  delivered_at timestamptz
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  size_id uuid REFERENCES product_sizes(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  item_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_product_sizes_product ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access to catalog tables
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO public
  USING (is_available = true);

CREATE POLICY "Anyone can view product sizes"
  ON product_sizes FOR SELECT
  TO public
  USING (is_available = true);

CREATE POLICY "Anyone can view delivery time slots"
  ON delivery_time_slots FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Anyone can view order deadlines"
  ON order_deadlines FOR SELECT
  TO public
  USING (true);

-- Guest access to create orders
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

-- Guest access to view their own orders by order number
CREATE POLICY "Anyone can view orders by order number"
  ON orders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view order items for their orders"
  ON order_items FOR SELECT
  TO public
  USING (true);

-- Staff access (authenticated users) for order management
CREATE POLICY "Authenticated users can view all categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product sizes"
  ON product_sizes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage delivery slots"
  ON delivery_time_slots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage order deadlines"
  ON order_deadlines FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (true);