
import { supabase } from "@/integrations/supabase/client";

export async function uploadMemberDocument(file: File, clientId: string, memberId: string): Promise<{url: string, name: string}> {
  if (!file) throw new Error("No file provided");

  const bucket = "client-member-documents";
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}/${memberId}.${fileExt}`;

  try {
    console.log("Starting upload to bucket:", bucket, "with fileName:", fileName);
    
    // First, check if the bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
      throw bucketError;
    }
    
    const bucketExists = buckets?.some(b => b.name === bucket);
    console.log("Bucket exists:", bucketExists);
    
    if (!bucketExists) {
      console.log("Creating bucket:", bucket);
      const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
        public: true
      });
      
      if (createBucketError) {
        console.error("Error creating bucket:", createBucketError);
        throw createBucketError;
      }
    }

    // Try to remove any existing file first (ignore errors)
    try {
      console.log("Attempting to remove existing file if any");
      await supabase.storage.from(bucket).remove([fileName]);
    } catch (err) {
      console.log("No existing file to remove or error:", err);
    }

    // Upload the new file
    console.log("Uploading file:", file.name, "size:", file.size, "type:", file.type);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    console.log("Upload successful, data:", uploadData);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    console.log("Public URL generated:", publicUrl);

    return {
      url: publicUrl,
      name: file.name
    };
  } catch (error) {
    console.error("File operation error:", error);
    throw error;
  }
}
