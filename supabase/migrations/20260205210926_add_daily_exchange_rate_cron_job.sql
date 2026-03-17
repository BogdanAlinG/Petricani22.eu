/*
  # Add daily exchange rate refresh cron job

  1. New Scheduled Job
    - `refresh-exchange-rate-daily`: Calls the existing `get-exchange-rate` edge function
      once per day at 06:00 UTC
    - Uses the same vault secrets pattern as the existing `sync-ical-feeds-every-30-min` job
    - The edge function already handles fetching from Stripe, caching, and fallback logic

  2. Important Notes
    - The `get-exchange-rate` function is deployed with verify_jwt=false, so it can be called
      without an auth token -- but we still pass the service role key for consistency
    - If Stripe is unavailable, the function gracefully falls back to the last known rate
    - This replaces the previous on-demand-only refresh pattern with a guaranteed daily update
*/

SELECT cron.schedule(
  'refresh-exchange-rate-daily',
  '0 6 * * *',
  $$
SELECT net.http_post(
  url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/get-exchange-rate',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key')
  ),
  body := '{}'::jsonb
);
$$
);
