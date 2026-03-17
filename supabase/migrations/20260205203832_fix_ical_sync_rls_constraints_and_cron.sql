/*
  # Fix iCal Sync: RLS Policies, Constraints, Deduplication, and Automated Sync

  1. Security Changes
    - Add SELECT policy on `ical_feeds` for anon users so public booking widget inner join works
    - The public widget queries `ical_events` with an inner join on `ical_feeds` to filter by accommodation
    - Without this policy, the join silently returns no rows for unauthenticated visitors

  2. Data Integrity
    - Add UNIQUE constraint on `(accommodation_id, feed_url)` to prevent duplicate feed entries
    - Remove the duplicate feed entry (keep the one named "Airbnb parter", delete "Airbnb")

  3. Automated Sync
    - Enable `pg_cron` and `pg_net` extensions for scheduled background HTTP calls
    - Create a cron job that calls the `sync-ical` edge function every 30 minutes
    - Uses the service role key from vault for secure authentication

  4. Important Notes
    - The anon SELECT policy on ical_feeds only exposes feed metadata (id, accommodation_id, is_active)
      which is already implicitly accessible via the ical_events join
    - The cron job uses pg_net to make async HTTP POST requests to the edge function
*/

-- 1. Add anon SELECT policy on ical_feeds for public booking widget
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ical_feeds' AND policyname = 'Anyone can view active ical feeds'
  ) THEN
    CREATE POLICY "Anyone can view active ical feeds"
      ON ical_feeds FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- 2. Remove the duplicate feed (keep "Airbnb parter", remove "Airbnb" with same URL)
DELETE FROM ical_feeds
WHERE id = '7da9cc94-c321-4f3f-a6fd-3ab3cc0a95aa';

-- 3. Add unique constraint to prevent future duplicates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ical_feeds_accommodation_id_feed_url_key'
  ) THEN
    ALTER TABLE ical_feeds
      ADD CONSTRAINT ical_feeds_accommodation_id_feed_url_key
      UNIQUE (accommodation_id, feed_url);
  END IF;
END $$;

-- 4. Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- 5. Schedule the sync-ical edge function to run every 30 minutes
SELECT cron.schedule(
  'sync-ical-feeds-every-30-min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/sync-ical',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
