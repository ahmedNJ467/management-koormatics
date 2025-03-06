
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const uploadPartImage = async (
  imageFile: File, 
  partId: string,
  onError: (message: string) => void
): Promise<string | null> => {
  try {
    // Check if the storage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const imagesBucketExists = buckets?.some(bucket => bucket.name === 'images');
    
    if (!imagesBucketExists) {
      console.error("The 'images' storage bucket does not exist");
      onError("The storage bucket doesn't exist. Please contact your administrator.");
      return null;
    }

    // If bucket exists, proceed with upload
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${partId}.${fileExt}`;
    const filePath = `parts/${fileName}`;

    console.log("Uploading image:", filePath);

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      onError("We couldn't upload the image: " + uploadError.message);
      return null;
    }

    console.log("Image uploaded successfully");
    return filePath;
  } catch (error) {
    console.error("Image upload error:", error);
    onError("We couldn't upload the image");
    return null;
  }
};

export const deletePartImage = async (imagePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from("images")
      .remove([imagePath]);
    
    if (error) {
      console.error("Error deleting image:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to delete image:", error);
    return false;
  }
};

export const checkPartImageColumnExists = async (): Promise<boolean> => {
  try {
    const { data: columnCheck } = await supabase
      .from('spare_parts')
      .select('part_image')
      .limit(1);
    
    const hasPartImageColumn = columnCheck && 
                               columnCheck.length > 0 && 
                               'part_image' in columnCheck[0];
    
    return hasPartImageColumn;
  } catch (error) {
    console.error("Error checking part_image column:", error);
    return false;
  }
};

export const updatePartWithImagePath = async (
  partId: string, 
  filePath: string,
  onError: (message: string) => void
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("spare_parts")
      .update({ part_image: filePath })
      .eq("id", partId);

    if (error) {
      console.error("Error updating part with image path:", error);
      onError("The part and image were saved but the link wasn't updated");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating part with image path:", error);
    onError("The part and image were saved but the link wasn't updated");
    return false;
  }
};
