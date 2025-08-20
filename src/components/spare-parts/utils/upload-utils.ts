
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Helper function to ensure the parts directory exists in the images bucket
export const createPartsDirectory = async (): Promise<boolean> => {
  try {
    console.log("Creating parts directory in images bucket");
    
    // Try to create the parts directory by uploading a placeholder file
    const { error } = await supabase.storage
      .from("images")
      .upload('parts/.placeholder', new Blob(['placeholder'], { type: 'text/plain' }), {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (error && !error.message.includes('already exists')) {
      console.error("Failed to create parts directory:", error);
      return false;
    }
    
    console.log("Parts directory created or verified successfully");
    return true;
  } catch (error) {
    console.error("Failed to create parts directory:", error);
    return false;
  }
};

export const uploadPartImage = async (
  imageFile: File, 
  partId: string,
  onError: (message: string) => void
): Promise<string | null> => {
  try {
    console.log("Starting image upload process for part:", partId);
    
    // Validate file before upload
    if (imageFile.size > 5 * 1024 * 1024) {
      onError("Image size exceeds 5MB limit.");
      return null;
    }
    
    if (!imageFile.type.startsWith('image/')) {
      onError("Selected file is not a valid image format.");
      return null;
    }
    
    // Make sure parts directory exists
    const dirCreated = await createPartsDirectory();
    if (!dirCreated) {
      onError("Could not create or access the upload directory.");
      return null;
    }
    
    // Upload the actual image file
    const fileExt = imageFile.name.split(".").pop() || 'jpeg';
    const fileName = `${partId}.${fileExt}`;
    const filePath = `parts/${fileName}`;
    
    console.log("Uploading image to path:", filePath);
    
    const { error: uploadError, data } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile, { 
        upsert: true,
        contentType: imageFile.type 
      });
    
    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      onError(`Upload failed: ${uploadError.message}`);
      return null;
    }
    
    console.log("Image uploaded successfully:", data);
    return filePath;
  } catch (error) {
    console.error("Image upload process error:", error);
    onError("We couldn't upload the image due to an unexpected error");
    return null;
  }
};

export const getPublicImageUrl = async (imagePath: string): Promise<string | null> => {
  try {
    if (!imagePath) return null;
    
    // Get the public URL
    const { data } = await supabase.storage
      .from("images")
      .getPublicUrl(imagePath);
    
    if (data?.publicUrl) {
      console.log("Public URL retrieved:", data.publicUrl);
      return data.publicUrl;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting public URL:", error);
    return null;
  }
};

export const deletePartImage = async (imagePath: string): Promise<boolean> => {
  try {
    if (!imagePath) return true;
    
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
