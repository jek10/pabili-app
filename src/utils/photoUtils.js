/**
 * Photo Upload Utilities
 * Handles file uploads to Supabase Storage
 */

import { supabase } from '../supabaseClient';

/**
 * Upload a photo file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} folder - Folder name in storage bucket (default: 'receipts')
 * @returns {Promise<string|null>} Public URL of uploaded file, or null if error
 */
export const uploadPhoto = async (file, folder = 'receipts') => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('receipts').getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    alert('Error uploading photo: ' + error.message);
    return null;
  }
};

/**
 * Delete a photo from Supabase Storage
 * @param {string} photoUrl - The public URL of the photo to delete
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const deletePhoto = async (photoUrl) => {
  try {
    // Extract file path from URL
    const urlParts = photoUrl.split('/receipts/');
    if (urlParts.length < 2) return false;

    const filePath = `receipts/${urlParts[1]}`;

    const { error } = await supabase.storage
      .from('receipts')
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};
