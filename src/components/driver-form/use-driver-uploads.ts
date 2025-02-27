
import { supabase } from "@/integrations/supabase/client";

export async function uploadDriverFile(file: File, bucket: string, driverId: string, fileType: string): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  // Use a simpler filename format that matches what we use in deletion
  const fileName = `${driverId}-${fileType}`;

  // Remove any existing file first
  try {
    await supabase.storage
      .from(bucket)
      .remove([fileName]);
  } catch (error) {
    console.log('No existing file to remove or error:', error);
  }

  // Upload the new file
  const { error: uploadError } = await supabase.storage
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
}
