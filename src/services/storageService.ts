import { supabase } from './supabase';

/**
 * Upload profile image to Supabase Storage and save URL to database
 * @param userId - The user's ID
 * @param imageUri - The local URI of the image to upload
 * @returns Object with public URL or error message
 */
export const uploadProfileImage = async (
  userId: string,
  imageUri: string
): Promise<{ url: string | null; error: string | null }> => {
  try {
    console.log('Starting upload for user:', userId);
    console.log('Image URI:', imageUri);

    // Generate consistent filename: userId/profile.jpg
    const fileName = `${userId}/profile.jpg`;

    console.log('Uploading to:', fileName);

    // Create a file object from the URI for React Native
    // React Native can handle file:// URIs directly in FormData
    const file: any = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    };

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      console.error('Upload error message:', uploadError.message);
      console.error('Upload error status:', (uploadError as any).status);
      
      // Provide helpful error message
      let errorMsg = uploadError.message;
      if (errorMsg.includes('Network request failed')) {
        errorMsg = 'Network error. Please check your internet connection and try again. If the problem persists, the storage bucket may not be configured properly.';
      }
      throw new Error(errorMsg);
    }

    console.log('Upload successful:', data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('profile-images').getPublicUrl(fileName);

    console.log('Public URL:', publicUrl);

    // Save URL to profile_images table
    const { data: upsertData, error: dbError } = await supabase
      .from('profile_images')
      .upsert({
        user_id: userId,
        image_url: publicUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (dbError) {
      console.error('Database save error (profile_images):', dbError);
      console.error('Error details:', JSON.stringify(dbError, null, 2));
      // Don't throw - image is uploaded, just log the error
      console.log('Image uploaded but failed to save URL to profile_images table');
    }

    console.log('Profile image URL saved to profile_images table:', upsertData);

    // Also update profiles.avatar_url for consistency across all user types
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Database save error (profiles):', profileError);
      console.error('Error details:', JSON.stringify(profileError, null, 2));
      console.log('Failed to update profiles.avatar_url');
    } else {
      console.log('Profile avatar_url updated in profiles table');
    }

    return { url: publicUrl, error: null };
  } catch (error: any) {
    console.error('Upload error:', error.message);
    console.error('Full error:', error);
    return { url: null, error: error.message };
  }
};

/**
 * Delete profile image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 * @returns Error message or null if successful
 */
export const deleteProfileImage = async (
  imageUrl: string
): Promise<{ error: string | null }> => {
  try {
    // Extract path from URL
    const path = imageUrl.split('/profile-images/')[1];
    if (!path) throw new Error('Invalid image URL');

    const { error } = await supabase.storage
      .from('profile-images')
      .remove([path]);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Delete error:', error.message);
    return { error: error.message };
  }
};
