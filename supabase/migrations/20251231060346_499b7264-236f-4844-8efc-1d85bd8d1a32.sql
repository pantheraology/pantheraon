-- Make studio-assets bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'studio-assets';

-- Remove public viewing policy
DROP POLICY IF EXISTS "Public can view studio assets" ON storage.objects;