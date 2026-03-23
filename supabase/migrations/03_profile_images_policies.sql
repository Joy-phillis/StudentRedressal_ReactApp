-- =====================================================
-- PROFILE IMAGES BUCKET POLICIES
-- Run this AFTER creating the bucket manually in Dashboard
-- =====================================================

-- Drop existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "public_view_profile_images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_upload_profile_images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_update_profile_images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_delete_profile_images" ON storage.objects;

-- Create new policies for profile-images bucket

-- Policy 1: Anyone can view profile images (public bucket)
CREATE POLICY "public_view_profile_images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

-- Policy 2: Authenticated users can upload to their own folder
CREATE POLICY "authenticated_users_upload_profile_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Users can update their own images
CREATE POLICY "authenticated_users_update_profile_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 4: Users can delete their own images
CREATE POLICY "authenticated_users_delete_profile_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Verify policies created
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%profile%';

-- =====================================================
-- Done! Profile image upload is now configured.
-- =====================================================
