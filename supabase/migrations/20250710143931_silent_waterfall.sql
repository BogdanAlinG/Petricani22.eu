/*
  # Contact Form Submissions Table

  1. New Tables
    - `contact_submissions`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, required)
      - `phone` (text, required)
      - `rental_period` (text, required)
      - `configuration` (text, required)
      - `message` (text, optional)
      - `language` (text, required)
      - `created_at` (timestamp)
      - `status` (text, default 'pending')

  2. Security
    - Enable RLS on `contact_submissions` table
    - Add policy for authenticated users to read their own submissions
    - Add policy for service role to insert submissions
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  rental_period text NOT NULL,
  configuration text NOT NULL,
  message text DEFAULT '',
  language text NOT NULL CHECK (language IN ('RO', 'EN')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy for service role to insert submissions (used by edge function)
DROP POLICY IF EXISTS "Service role can insert submissions" ON contact_submissions;
CREATE POLICY "Service role can insert submissions"
  ON contact_submissions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy for authenticated users to read all submissions (for admin purposes)
DROP POLICY IF EXISTS "Authenticated users can read submissions" ON contact_submissions;
CREATE POLICY "Authenticated users can read submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at 
  ON contact_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status 
  ON contact_submissions(status);