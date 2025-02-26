
import { supabase } from "@/integrations/supabase/client";

export async function uploadDriverFile(file: File, bucket: string, driverId: string, fileType: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${driverId}/${fileType}.${fileExt}`;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("No active session");
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}
