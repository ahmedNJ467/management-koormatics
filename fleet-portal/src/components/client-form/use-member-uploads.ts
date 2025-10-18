
import { supabase } from "@/integrations/supabase/client";

export async function uploadMemberDocument(file: File, clientId: string, memberId: string): Promise<{url: string, name: string}> {
  if (!file) throw new Error("No file provided");

  const bucket = "client-member-documents";
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}/${memberId}.${fileExt}`;

  try {
    console.log("Starting upload to bucket:", bucket, "with fileName:", fileName);
    
    // No need to check if bucket exists or create it since we've done that with SQL
    // Just attempt to remove any existing file first (ignore errors)
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
