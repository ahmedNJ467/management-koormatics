
import { supabase } from "@/integrations/supabase/client";

export async function uploadClientFile(file: File, bucket: string, clientId: string, fileType: string): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}-${fileType}.${fileExt}`;

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

export interface ClientDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export async function uploadClientDocument(file: File, clientId: string): Promise<ClientDocument> {
  const timestamp = new Date().toISOString();
  const fileId = crypto.randomUUID();
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}/${fileId}.${fileExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('client-documents')
      .getPublicUrl(fileName);

    return {
      id: fileId,
      name: file.name,
      url: publicUrl,
      uploadedAt: timestamp
    };
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
}
