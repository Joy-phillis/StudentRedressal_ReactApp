import { supabase } from './supabase';

/**
 * Upload profile image to Supabase Storage
 * @param userId - The user's ID (used as folder name)
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

    // For React Native, we need to handle the URI differently
    // Check if it's a local file URI
    const isLocalFile = imageUri.startsWith('file://') || imageUri.startsWith('/');
    
    let blob: Blob;
    if (isLocalFile) {
      // For local files, use XMLHttpRequest
      blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
          resolve(xhr.response);
        };
        xhr.onerror = function(e) {
          console.log('XHR error:', e);
          reject(new Error('Failed to load image'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', imageUri, true);
        xhr.send(null);
      });
    } else {
      // For remote URIs, use fetch
      const response = await fetch(imageUri);
      blob = await response.blob();
    }

    console.log('Blob created:', blob.type, blob.size);

    // Generate unique filename
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    console.log('Uploading to:', fileName);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful:', data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('profile-images').getPublicUrl(fileName);

    console.log('Public URL:', publicUrl);

    return { url: publicUrl, error: null };
  } catch (error: any) {
    console.error('Upload error:', error.message);
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
