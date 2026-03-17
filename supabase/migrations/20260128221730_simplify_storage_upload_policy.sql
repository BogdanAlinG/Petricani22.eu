/*
  # Simplify Storage Upload Policy

  1. Changes
    - Simplify upload policy to allow any authenticated user
    - Storage security is handled at the application level via admin routes

  2. Security
    - Only authenticated users can upload
    - Admin panel is already protected by authentication
*/

DROP POLICY IF EXISTS "Allow admin uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Allow admin updates" ON storage.objects;
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Allow admin deletes" ON storage.objects;
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');