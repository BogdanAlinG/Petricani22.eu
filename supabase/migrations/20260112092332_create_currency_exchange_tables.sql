/*
  # Currency Exchange Rate System
  
  1. New Tables
    - `exchange_rates`
      - `id` (uuid, primary key)
      - `base_currency` (text) - Base currency code (EUR)
      - `target_currency` (text) - Target currency code (RON)
      - `rate` (numeric) - Exchange rate value
      - `source` (text) - Source of rate (stripe, manual, fallback)
      - `fetched_at` (timestamptz) - When rate was fetched
      - `is_active` (boolean) - Whether this is the current active rate
      - `created_at` (timestamptz) - Record creation time
      
  2. Security
    - Enable RLS on `exchange_rates` table
    - Public read access for active rates
    - Service role can insert and update rates
    
  3. Indexes
    - Index on (base_currency, target_currency, is_active) for fast lookups
    - Index on fetched_at for historical queries
*/

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL CHECK (base_currency IN ('EUR', 'RON')),
  target_currency text NOT NULL CHECK (target_currency IN ('EUR', 'RON')),
  rate numeric(10, 6) NOT NULL CHECK (rate > 0),
  source text NOT NULL DEFAULT 'stripe' CHECK (source IN ('stripe', 'manual', 'fallback')),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to read active exchange rates
CREATE POLICY "Anyone can read active exchange rates"
  ON exchange_rates
  FOR SELECT
  USING (is_active = true);

-- Policy for service role to insert rates
CREATE POLICY "Service role can insert rates"
  ON exchange_rates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy for service role to update rates
CREATE POLICY "Service role can update rates"
  ON exchange_rates
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup 
  ON exchange_rates(base_currency, target_currency, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched 
  ON exchange_rates(fetched_at DESC);

-- Function to get active exchange rate
CREATE OR REPLACE FUNCTION get_active_exchange_rate(
  p_base_currency text,
  p_target_currency text
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_rate numeric;
BEGIN
  -- If same currency, return 1
  IF p_base_currency = p_target_currency THEN
    RETURN 1.0;
  END IF;
  
  -- Get active rate
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE base_currency = p_base_currency
    AND target_currency = p_target_currency
    AND is_active = true
  ORDER BY fetched_at DESC
  LIMIT 1;
  
  -- If no rate found, return NULL
  RETURN v_rate;
END;
$$;

-- Function to convert currency
CREATE OR REPLACE FUNCTION convert_currency(
  p_amount numeric,
  p_from_currency text,
  p_to_currency text
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_rate numeric;
  v_result numeric;
BEGIN
  -- If same currency, return original amount
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;
  
  -- Get the exchange rate
  v_rate := get_active_exchange_rate(p_from_currency, p_to_currency);
  
  -- If no rate found, return NULL
  IF v_rate IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate converted amount
  v_result := p_amount * v_rate;
  
  RETURN v_result;
END;
$$;

-- Update contact_submissions table to track currency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'currency'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN currency text DEFAULT 'EUR' CHECK (currency IN ('EUR', 'RON'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'exchange_rate_used'
  ) THEN
    ALTER TABLE contact_submissions ADD COLUMN exchange_rate_used numeric(10, 6);
  END IF;
END $$;