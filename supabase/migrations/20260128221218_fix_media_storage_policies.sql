/*
  # Fix Media Storage Policies for Admin-Only Access

  1. Changes
    - Update storage policies to require admin status for uploads/updates/deletes
    - Keep public read access for serving images

  2. Security
    - Only admins can upload, update, or delete files
    - Anyone can view/download files (required for public image serving)
*/

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow admin uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_app_meta_data->>'role' = 'admin'
      OR raw_app_meta_data->>'is_admin' = 'true'
      OR email LIKE '%@petricani22.eu'
    )
  )
);

DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
CREATE POLICY "Allow admin updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_app_meta_data->>'role' = 'admin'
      OR raw_app_meta_data->>'is_admin' = 'true'
      OR email LIKE '%@petricani22.eu'
    )
  )
);

DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
CREATE POLICY "Allow admin deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_app_meta_data->>'role' = 'admin'
      OR raw_app_meta_data->>'is_admin' = 'true'
      OR email LIKE '%@petricani22.eu'
    )
  )
);