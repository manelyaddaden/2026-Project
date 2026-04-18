# Image Display Issue - Diagnostic & Fix Guide

## Problem
Images stored in Supabase are showing as blank in the mobile app.

---

## **STEP 1: Verify Supabase Storage Setup** ✅

### Check Bucket Permissions (CRITICAL)
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Storage** → **Buckets**
3. Click on the **`images`** bucket
4. Go to **Policies** tab
5. **You should see a policy allowing public read access**

### If No Public Policy Exists:
1. Click **"New policy"** → **"For SELECT queries"**
2. Set:
   - **Target roles**: `Authenticated` AND `Anonymous` (select both)
   - **Using expression**: Leave empty or use `bucket_id = 'images'`
3. Click **Save**

### Alternative: Create Policy via SQL
In Supabase SQL Editor, run:
```sql
CREATE POLICY "Enable read access for all users" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'images');
```

---

## **STEP 2: Test the URLs in App** ✅

Check your console logs when uploading images:

```
✅ Image uploaded to Supabase: https://vrflevqloulfkulgwmld.supabase.co/storage/v1/object/public/images/1712345678_abc123.jpg
✅ URL is accessible (Status: 200)
```

- ✅ If you see `Status: 200` → URL is accessible
- ❌ If you see `Status: 403` → **Bucket permissions issue**
- ❌ If error occurs → **Bucket or URL problem**

---

## **STEP 3: Fix React Native Image Display** ✅

### Add Image Display Wrapper
Create [src/components/common/CachedImage.js](../src/components/common/CachedImage.js):

```javascript
import React, { useState } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';

export function CachedImage({ source, style, onError }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {loading && (
        <ActivityIndicator 
          size="large" 
          color="#999" 
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
      )}
      <Image
        source={source}
        style={style}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(error) => {
          console.error('❌ Image load error:', error.nativeEvent.error);
          setError(true);
          setLoading(false);
          onError?.(error);
        }}
      />
    </View>
  );
}
```

### Update Image Components
In **ProductDetailScreen.js** and **SellerProfilePage.js**, replace:
```javascript
<Image
  source={{ uri: product.imageUrl }}
  style={styles.detailImage}
/>
```

With:
```javascript
<CachedImage
  source={{ uri: product.imageUrl }}
  style={styles.detailImage}
  onError={(e) => console.log('Image failed to load:', product.imageUrl)}
/>
```

---

## **STEP 4: Verify Image Upload** ✅

Your [src/utils/imageUpload.js](../src/utils/imageUpload.js) now includes:
- URL accessibility test after upload
- Better error logging
- Console warnings if bucket permissions are missing

Check console when uploading for messages like:
```
⚠️ Warning: URL not immediately accessible. This may be a permissions issue.
Ensure the "images" bucket in Supabase has public read access enabled.
```

---

## **STEP 5: Common Issues & Solutions** ✅

| Issue | Cause | Solution |
|-------|-------|----------|
| **403 Forbidden** | Bucket not public | Add public read policy (Step 1) |
| **404 Not Found** | File doesn't exist | Check upload logs, ensure file uploaded |
| **Blank image** | URL valid but image not loading | Check network tab, verify bucket permissions |
| **Slow loading** | Large image or slow network | Compress images before upload |

---

## **Debugging Checklist**

- [ ] Supabase `images` bucket has public read policy
- [ ] Console shows `Status: 200` for uploaded images
- [ ] Image URLs are in format: `https://vrflevqloulfkulgwmld.supabase.co/storage/v1/object/public/images/...`
- [ ] React Native `Image` component has explicit width/height in styles
- [ ] No network errors in console when loading images
- [ ] Image file was actually uploaded (checked Supabase Storage)

---

## **Quick Test**

1. Upload an image in the app
2. Open browser DevTools/Network tab
3. Search for the image URL in your Supabase console
4. Try opening the full URL in browser - should display image
5. If it shows 403 → you have a permissions issue
