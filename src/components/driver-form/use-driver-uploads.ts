
import { supabase } from "@/integrations/supabase/client";

export async function uploadDriverFile(file: File, bucket: string, driverId: string, fileType: string): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${driverId}-${fileType}.${fileExt}`;

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw new Error(`Failed to access storage: ${listError.message}`);
    }
    
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      // Try to create bucket (may fail due to permissions - that's okay, buckets should be created via migration)
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true
      });
      
      if (createError) {
        // If bucket creation fails, it's likely a permissions issue
        // The bucket should be created via migration instead
        console.warn(`Bucket ${bucket} does not exist and could not be created. Please run the migration to create storage buckets.`, createError);
        throw new Error(`Storage bucket '${bucket}' not found. Please ensure the bucket has been created in Supabase Storage.`);
      }
    }

    // Remove any existing file first
    await supabase.storage
      .from(bucket)
      .remove([fileName])
      .then(({ error }) => {
        if (error && error.message !== 'Object not found') {
          console.error('Error removing existing file:', error);
        }
      });

    // Upload the new file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('File operation error:', error);
    throw error;
  }
}
