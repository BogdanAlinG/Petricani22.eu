/*
  # Fix Items Per Category Limit Default

  1. Changes
    - Update existing foodnation sync configuration to set items_per_category_limit to NULL (unlimited)
    - This fixes the issue where only 1 product per category was being synced
  
  2. Notes
    - NULL means unlimited syncing (default behavior)
    - Users can still set a specific limit via the admin panel if desired
*/

-- Update the existing foodnation configuration to remove the limit
UPDATE sync_configurations
SET items_per_category_limit = NULL,
    updated_at = now()
WHERE source_name = 'foodnation';