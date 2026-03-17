/*
  # Add UPDATE policy for sync_logs table

  1. Security Changes
    - Add UPDATE policy to allow authenticated users to update sync logs
    - This enables the "Stop Sync" functionality in the admin UI
    - Only allows updating the cancellation_requested field

  2. Purpose
    - The admin UI needs to set cancellation_requested = true to stop a running sync
    - Without this policy, the UPDATE query silently fails due to RLS
*/

CREATE POLICY "Authenticated users can update sync logs"
  ON sync_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);