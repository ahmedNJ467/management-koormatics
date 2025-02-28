
import { supabase } from "@/integrations/supabase/client";

export async function uploadMemberDocument(file: File, clientId: string, memberId: string): Promise<{url: string, name: string}> {
  if (!file) throw new Error("No file provided");

  const bucket = "client-member-documents";
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}/${memberId}.${fileExt}`;

  try {
    // Check if bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucket, {
        public: true
      });
    }

    // Remove any existing file first
    try {
      await supabase.storage.from(bucket).remove([fileName]);
    } catch(err) {
      // Ignore error if file doesn't exist
    }

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

    return {
      url: publicUrl,
      name: file.name
    };
  } catch (error) {
    console.error('File operation error:', error);
    throw error;
  }
}
