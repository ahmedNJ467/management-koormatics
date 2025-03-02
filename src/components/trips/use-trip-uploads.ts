
import { supabase } from "@/integrations/supabase/client";

export async function uploadTripFile(
  file: File, 
  bucket: string, 
  tripId: string, 
  fileType: string
): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${tripId}-${fileType}-${Date.now()}.${fileExt}`;

  try {
    // Check if bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucket, {
        public: true
      });
    }

    // Upload the file
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

export async function uploadTripAttachment(
  file: File, 
  tripId: string
): Promise<string | null> {
  return uploadTripFile(file, 'trip-attachments', tripId, 'attachment');
}
