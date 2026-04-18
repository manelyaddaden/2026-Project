import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from '../supabaseConfig';

// Function to upload image to Supabase and get URL
export async function uploadImageToSupabase(imageUri) {
  try {
    // Generate unique filename (no nested path in filename)
    const timestamp = Date.now();
    const filename = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    let blob;

    // Handle different URI formats for different platforms
    if (imageUri.startsWith('file://') || imageUri.startsWith('/') || Platform.OS === 'android') {
      // For Android/phone file:// URIs, use FileSystem to read as base64
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
        
        // Convert base64 to byte array (don't use Blob in React Native)
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        blob = { data: bytes, type: 'image/jpeg' };
      } catch (fsError) {
        console.error('❌ FileSystem error:', fsError);
        // Fallback to fetch if FileSystem fails
        const response = await fetch(imageUri);
        blob = await response.blob();
      }
    } else {
      // For web or other URIs, use fetch directly
      const response = await fetch(imageUri);
      blob = await response.blob();
    }



    // Handle blob for Supabase - React Native needs conversion
    let uploadData = blob;
    if (Platform.OS !== 'web' && blob.data && Array.isArray(blob.data)) {
      // Convert byte array to Uint8Array for Supabase
      uploadData = new Uint8Array(blob.data);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filename, uploadData, {
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error('Failed to upload image: ' + error.message);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filename);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to generate public URL');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Image upload error:', error);
    throw error;
  }
}

// Helper function to handle image display with error fallback
export function createImageSource(imageUrl) {
  if (!imageUrl) {
    return null;
  }
  
  // Ensure URL is properly formatted
  const url = typeof imageUrl === 'string' ? imageUrl.trim() : imageUrl;
  
  return { uri: url };
}
