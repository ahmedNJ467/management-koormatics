
import { supabase } from "@/integrations/supabase/client";

export async function uploadDriverFile(file: File, bucket: string, driverId: string, fileType: string): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${driverId}-${fileType}.${fileExt}`;

  try {
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
