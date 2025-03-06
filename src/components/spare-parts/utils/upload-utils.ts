
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const uploadPartImage = async (
  imageFile: File, 
  partId: string,
  onError: (message: string) => void
): Promise<string | null> => {
  try {
    console.log("Starting image upload process for part:", partId);
    
    // First, try to get the bucket info to verify if it exists and is accessible
    const { data: bucketInfo, error: bucketInfoError } = await supabase.storage
      .getBucket('images');
    
    if (bucketInfoError) {
      console.error("Error accessing images bucket:", bucketInfoError);
      onError(`Cannot access the storage bucket: ${bucketInfoError.message}. Please contact your administrator.`);
      return null;
    }
    
    if (!bucketInfo) {
      console.error("The 'images' storage bucket is not accessible");
      onError("The storage bucket is not accessible. Please check your Supabase storage configuration.");
      return null;
    }
    
    console.log("Images bucket exists and is accessible:", bucketInfo);

    // Proceed with the upload
    try {
      // First check if the parts directory exists by trying to list files
      const { data: existingFiles, error: listError } = await supabase.storage
        .from("images")
        .list('parts');
      
      if (listError) {
        console.error("Error checking parts directory:", listError);
        // Create the directory if we can't list it (might not exist)
        try {
          console.log("Attempting to create parts directory...");
          await supabase.storage
            .from("images")
            .upload('parts/.gitkeep', new Blob(['']));
          
          console.log("Created parts directory in images bucket");
        } catch (createDirError) {
          console.error("Failed to create parts directory:", createDirError);
          // Continue anyway as the upload might still work
        }
      } else {
        console.log("Parts directory exists with files:", existingFiles?.length || 0);
      }
    } catch (dirError) {
      console.error("Directory check error:", dirError);
      // Try to create the directory anyway
      try {
        await supabase.storage
          .from("images")
          .upload('parts/.gitkeep', new Blob(['']));
      } catch (createDirError) {
        console.error("Failed to create parts directory:", createDirError);
        // Continue anyway, the upload might still work
      }
    }

    // If bucket exists, proceed with upload
    const fileExt = imageFile.name.split(".").pop() || 'jpeg';
    const fileName = `${partId}.${fileExt}`;
    const filePath = `parts/${fileName}`;

    console.log("Uploading image to path:", filePath);

    const { error: uploadError, data } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile, { upsert: true });

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
    
    console.log("Getting public URL for image:", imagePath);
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
