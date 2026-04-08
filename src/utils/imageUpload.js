import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from '../supabaseConfig';

// Function to upload image to Supabase and get URL
export async function uploadImageToSupabase(imageUri) {
  try {
    // Generate unique filename (no nested path in filename)
    const timestamp = Date.now();
    const filename = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    console.log('🔄 Attempting to upload image to Supabase...');
    console.log('📱 Image URI:', imageUri);
    console.log('🖥️ Platform:', Platform.OS);

    let blob;

    // Handle different URI formats for different platforms
    if (imageUri.startsWith('file://') || imageUri.startsWith('/') || Platform.OS === 'android') {
      // For Android/phone file:// URIs, use FileSystem to read as base64
      console.log('📂 Reading file from local file system...');
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
        blob = await fetch(`data:image/jpeg;base64,${base64}`).then(res => res.blob());
        console.log('✅ Converted file:// URI to blob');
      } catch (fsError) {
        console.error('❌ FileSystem error:', fsError);
        // Fallback to fetch if FileSystem fails
        const response = await fetch(imageUri);
        blob = await response.blob();
      }
    } else {
      // For web or other URIs, use fetch directly
      console.log('🌐 Fetching image via HTTP...');
      const response = await fetch(imageUri);
      blob = await response.blob();
    }

    console.log('📸 Image blob size:', blob.size, 'bytes');

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error('Failed to upload image: ' + error.message);
    }

    console.log('✅ File uploaded, getting public URL...');

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filename);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to generate public URL');
    }

    console.log('✅ Image uploaded to Supabase:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Image upload error:', error);
    throw error;
  }
}
