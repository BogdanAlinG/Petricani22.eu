/*
  # Add products_failed column to sync_logs

  1. Modified Tables
    - `sync_logs`
      - Added `products_failed` (integer, default 0) to track products that failed during sync
        separately from products that were intentionally skipped

  2. Important Notes
    - Previously, failed products were counted under `products_skipped`, making it impossible
      to distinguish between products that were skipped intentionally (e.g., recently synced)
      and products that actually encountered errors during insert/update
    - The status CHECK constraint already includes 'cancelled' so no change needed there
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'products_failed'
  ) THEN
    ALTER TABLE sync_logs ADD COLUMN products_failed integer DEFAULT 0;
  END IF;
END $$;
