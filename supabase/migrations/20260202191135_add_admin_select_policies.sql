/*
  # Add Admin SELECT Policies

  This migration adds explicit SELECT policies for admins to ensure they can view
  all records in accommodation-related tables, including hidden ones.

  ## Changes:
  - Add "Admins can view all accommodations" SELECT policy
  - Add "Admins can view all accommodation images" SELECT policy
  - These policies allow admins to see all records regardless of visibility status
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accommodations' AND policyname = 'Admins can view all accommodations') THEN
    CREATE POLICY "Admins can view all accommodations"
      ON accommodations FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accommodation_images' AND policyname = 'Admins can view all accommodation images') THEN
    CREATE POLICY "Admins can view all accommodation images"
      ON accommodation_images FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;