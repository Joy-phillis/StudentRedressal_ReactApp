-- =====================================================
-- COMPLETE PROFILE IMAGE SETUP
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- PART 1: Create profile_images table (if it doesn't exist)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profile_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index
CREATE INDEX IF NOT EXISTS profile_images_user_id_idx ON public.profile_images(user_id);

-- Enable RLS
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile image" ON public.profile_images;
DROP POLICY IF EXISTS "Users can insert own profile image" ON public.profile_images;
DROP POLICY IF EXISTS "Users can update own profile image" ON public.profile_images;
DROP POLICY IF EXISTS "Anyone can view profile images" ON public.profile_images;

-- Policies
CREATE POLICY "Users can view own profile image"
  ON public.profile_images FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile image"
  ON public.profile_images FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile image"
  ON public.profile_images FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view profile images"
  ON public.profile_images FOR SELECT
  TO public
  USING (true);

-- Grant permissions
GRANT ALL ON public.profile_images TO authenticated;
GRANT ALL ON public.profile_images TO public;


-- PART 2: Create storage bucket (will error if exists, that's ok)
-- =====================================================

-- Try to create bucket, ignore error if it already exists
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'profile-images',
    'profile-images',
    true,
    5242880,
    NULL  -- Allow all MIME types (no restriction)
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Bucket already exists, skipping creation';
  WHEN OTHERS THEN
    RAISE NOTICE 'Bucket creation skipped: %', SQLERRM;
END $$;

-- Update bucket settings if it exists (remove MIME type restriction)
UPDATE storage.buckets SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = NULL  -- NULL means allow all types
WHERE id = 'profile-images';


-- PART 3: Create storage policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "public_view_profile_images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_upload_profile_images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_update_profile_images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_delete_profile_images" ON storage.objects;

-- Create policies
CREATE POLICY "public_view_profile_images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

CREATE POLICY "authenticated_users_upload_profile_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "authenticated_users_update_profile_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "authenticated_users_delete_profile_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- PART 4: Grant storage permissions
-- =====================================================

GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;


-- PART 5: Verify setup
-- =====================================================

-- Check table exists
SELECT tablename FROM pg_tables WHERE tablename = 'profile_images';

-- Check bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'profile-images';

-- Check policies
SELECT policyname, cmd FROM pg_policies WHERE policyname LIKE '%profile%';

-- =====================================================
-- Setup complete!
-- =====================================================
