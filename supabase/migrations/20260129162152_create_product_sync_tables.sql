/*
  # Product Sync System Tables
  
  1. New Tables
    - `sync_configurations` - Stores sync settings and mappings
      - `id` (uuid, primary key)
      - `source_name` (text) - Name of the source (e.g., 'foodnation')
      - `source_url` (text) - API endpoint URL
      - `category_mappings` (jsonb) - Maps source categories to local category IDs
      - `items_per_category_limit` (integer) - Max items to sync per category (null = unlimited)
      - `is_active` (boolean) - Whether sync is enabled
      - `last_sync_at` (timestamptz) - Last successful sync timestamp
      - `created_at`, `updated_at` (timestamptz)
    
    - `sync_logs` - Tracks sync operations and results
      - `id` (uuid, primary key)
      - `configuration_id` (uuid) - References sync_configurations
      - `status` (text) - 'running', 'completed', 'failed'
      - `products_synced` (integer) - Count of products synced
      - `products_skipped` (integer) - Count of products skipped
      - `error_message` (text) - Error details if failed
      - `started_at`, `completed_at` (timestamptz)
    
    - `synced_products` - Tracks which products came from sync
      - `id` (uuid, primary key)
      - `product_id` (uuid) - References products table
      - `source_id` (text) - External product ID from source
      - `source_name` (text) - Name of the source
      - `source_data` (jsonb) - Original data from source
      - `last_synced_at` (timestamptz)
  
  2. Security
    - RLS enabled on all tables
    - Only authenticated users can access sync tables
*/

-- Create sync_configurations table
CREATE TABLE IF NOT EXISTS sync_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_url text NOT NULL,
  category_mappings jsonb DEFAULT '{}',
  items_per_category_limit integer DEFAULT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_source_name UNIQUE (source_name)
);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES sync_configurations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  products_synced integer DEFAULT 0,
  products_skipped integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create synced_products table to track external product mappings
CREATE TABLE IF NOT EXISTS synced_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_id text NOT NULL,
  source_name text NOT NULL,
  source_data jsonb DEFAULT '{}',
  last_synced_at timestamptz DEFAULT now(),
  CONSTRAINT unique_source_product UNIQUE (source_name, source_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_configuration ON sync_logs(configuration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_synced_products_product ON synced_products(product_id);
CREATE INDEX IF NOT EXISTS idx_synced_products_source ON synced_products(source_name, source_id);

-- Enable RLS
ALTER TABLE sync_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_products ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view sync configurations
CREATE POLICY "Authenticated users can view sync configurations"
  ON sync_configurations FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can manage sync configurations
CREATE POLICY "Authenticated users can insert sync configurations"
  ON sync_configurations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sync configurations"
  ON sync_configurations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sync configurations"
  ON sync_configurations FOR DELETE
  TO authenticated
  USING (true);

-- Only authenticated users can view sync logs
CREATE POLICY "Authenticated users can view sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert sync logs
CREATE POLICY "Authenticated users can insert sync logs"
  ON sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update sync logs
CREATE POLICY "Authenticated users can update sync logs"
  ON sync_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can view synced products
CREATE POLICY "Authenticated users can view synced products"
  ON synced_products FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can manage synced products
CREATE POLICY "Authenticated users can insert synced products"
  ON synced_products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update synced products"
  ON synced_products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete synced products"
  ON synced_products FOR DELETE
  TO authenticated
  USING (true);

-- Insert default FoodNation configuration
INSERT INTO sync_configurations (source_name, source_url, items_per_category_limit, is_active)
VALUES ('foodnation', 'https://foodnation.ro/products.json', 1, true)
ON CONFLICT (source_name) DO NOTHING;