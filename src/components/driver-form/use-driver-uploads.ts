
import { supabase } from "@/integrations/supabase/client";

export async function uploadDriverFile(file: File, bucket: string, driverId: string, fileType: string): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${driverId}-${fileType}.${fileExt}`;

  try {
    // Buckets should already exist - skip creation check to avoid RLS errors
    // If bucket doesn't exist, the upload will fail with a clear error message

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
      
      // Provide more helpful error messages
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
        throw new Error(`Storage bucket '${bucket}' not found. Please ensure the bucket exists in Supabase Storage and RLS policies are configured.`);
      }
      
      if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('RLS')) {
        throw new Error(`Permission denied: RLS policies may not be configured for bucket '${bucket}'. Please run the RLS policies SQL script.`);
      }
      
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
