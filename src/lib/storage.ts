import { supabase } from './supabase';

const BUCKET_NAME = 'social-records-images';

/**
 * Initialize storage bucket for social record images
 */
export async function initializeStorageBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
  
  if (error && error.message.includes('not found')) {
    // Create bucket if it doesn't exist
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }
    );
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      return { error: createError };
    }
    
    // Set up RLS policies for the bucket
    await setupStoragePolicies();
  }
  
  return { data, error };
}

/**
 * Set up Row Level Security policies for storage bucket
 */
async function setupStoragePolicies() {
  // This should be done via SQL migrations in production
  // Here's the SQL that should be run:
  
  const sql = `
    -- Drop existing policies
    DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
    DROP POLICY IF EXISTS "Providers can upload images" ON storage.objects;
    DROP POLICY IF EXISTS "Providers can delete their images" ON storage.objects;
    
    -- Allow authenticated users to view images
    CREATE POLICY "Authenticated users can view images"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = '${BUCKET_NAME}');
    
    -- Allow approved providers to upload images
    CREATE POLICY "Providers can upload images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = '${BUCKET_NAME}' AND
      (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
    );
    
    -- Allow providers to delete their own images
    CREATE POLICY "Providers can delete their images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = '${BUCKET_NAME}' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  `;
  
  // In production, this should be run via migration
  console.log('Storage policies SQL:', sql);
}

/**
 * Upload an image for a social record
 */
export async function uploadRecordImage(
  recordId: string,
  providerId: string,
  file: File,
  index: number
): Promise<{ url: string; path: string } | null> {
  try {
    // Ensure bucket exists
    await initializeStorageBucket();
    
    // Create file path: provider_id/record_id/timestamp_index.jpg
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${index}.${fileExt}`;
    const filePath = `${providerId}/${recordId}/${fileName}`;
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    // Get public URL (or signed URL for private bucket)
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

/**
 * Upload multiple images for a social record
 */
export async function uploadRecordImages(
  recordId: string,
  providerId: string,
  files: File[]
): Promise<string[]> {
  const uploadPromises = files.map((file, index) =>
    uploadRecordImage(recordId, providerId, file, index)
  );
  
  const results = await Promise.all(uploadPromises);
  
  return results
    .filter((result): result is { url: string; path: string } => result !== null)
    .map(result => result.url);
}

/**
 * Delete an image from storage
 */
export async function deleteRecordImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);
    
    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Delete all images for a record
 */
export async function deleteRecordImages(imageUrls: string[]): Promise<boolean> {
  try {
    // Extract paths from URLs
    const paths = imageUrls.map(url => {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts.slice(pathParts.indexOf(BUCKET_NAME) + 1).join('/');
    }).filter(Boolean);
    
    if (paths.length === 0) return true;
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);
    
    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Get a signed URL for private images (valid for 1 hour)
 */
export async function getSignedUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600); // 1 hour
    
    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    return null;
  }
}
