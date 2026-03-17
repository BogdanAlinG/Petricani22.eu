/*
  # Add Sync Progress Tracking, Cancellation, and Detailed Logs

  1. Changes to sync_logs table
    - Add `progress_current` (integer) - products processed so far
    - Add `progress_total` (integer) - total products to process
    - Add `current_phase` (text) - current operation description
    - Add `cancellation_requested` (boolean) - flag to signal stop
    - Add `products_created` (integer) - count of newly created products
    - Add `products_updated` (integer) - count of updated products
    - Update status constraint to include 'cancelled'

  2. Changes to sync_configurations table
    - Add `skip_if_synced_within_hours` (integer) - hours threshold to skip recently synced products

  3. New Tables
    - `sync_log_details` - Detailed per-product logs
      - `id` (uuid, primary key)
      - `sync_log_id` (uuid) - references sync_logs
      - `source_product_id` (text) - FoodNation product ID
      - `product_title` (text) - product name for identification
      - `action` (text) - 'created', 'updated', 'skipped', or 'failed'
      - `skip_reason` (text, nullable) - reason if skipped
      - `error_message` (text, nullable) - error details if failed
      - `processed_at` (timestamptz) - when processed

  4. Security
    - Enable RLS on sync_log_details
    - Add policies for authenticated users
*/

-- Add new columns to sync_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'progress_current'
  ) THEN
    ALTER TABLE sync_logs ADD COLUMN progress_current integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'progress_total'
  ) THEN
    ALTER TABLE sync_logs ADD COLUMN progress_total integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'current_phase'
  ) THEN
    ALTER TABLE sync_logs ADD COLUMN current_phase text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'cancellation_requested'
  ) THEN
    ALTER TABLE sync_logs ADD COLUMN cancellation_requested boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'products_created'
  ) THEN
    ALTER TABLE sync_logs ADD COLUMN products_created integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'products_updated'
  ) THEN
    ALTER TABLE sync_logs ADD COLUMN products_updated integer DEFAULT 0;
  END IF;
END $$;

-- Update status constraint to include 'cancelled'
ALTER TABLE sync_logs DROP CONSTRAINT IF EXISTS sync_logs_status_check;
ALTER TABLE sync_logs ADD CONSTRAINT sync_logs_status_check 
  CHECK (status IN ('running', 'completed', 'failed', 'cancelled'));

-- Add skip_if_synced_within_hours to sync_configurations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_configurations' AND column_name = 'skip_if_synced_within_hours'
  ) THEN
    ALTER TABLE sync_configurations ADD COLUMN skip_if_synced_within_hours integer DEFAULT 24;
  END IF;
END $$;

-- Create sync_log_details table
CREATE TABLE IF NOT EXISTS sync_log_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_log_id uuid NOT NULL REFERENCES sync_logs(id) ON DELETE CASCADE,
  source_product_id text NOT NULL,
  product_title text NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'skipped', 'failed')),
  skip_reason text,
  error_message text,
  processed_at timestamptz DEFAULT now()
);

-- Create index for fast lookups by sync_log_id
CREATE INDEX IF NOT EXISTS idx_sync_log_details_sync_log ON sync_log_details(sync_log_id);

-- Enable RLS on sync_log_details
ALTER TABLE sync_log_details ENABLE ROW LEVEL SECURITY;

-- RLS policies for sync_log_details
CREATE POLICY "Authenticated users can view sync log details"
  ON sync_log_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sync log details"
  ON sync_log_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sync log details"
  ON sync_log_details FOR DELETE
  TO authenticated
  USING (true);