import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const createPartsDirectory = async (): Promise<boolean> => {
  try {
    console.log("Creating parts directory in images bucket");
    await supabase.storage
      .from("images")
      .upload('parts/.placeholder', new Blob(['']));
    console.log("Parts directory created successfully");
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
    
    // First, check if storage is available
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage
        .listBuckets();
      
      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        onError(`Storage service may not be properly configured: ${bucketsError.message}`);
        return null;
      }
      
      const imagesBucketExists = buckets?.some(bucket => bucket.id === 'images');
      
      if (!imagesBucketExists) {
        console.error("The 'images' bucket does not exist in this project");
        onError("The storage bucket 'images' does not exist. Please contact your administrator to set up storage.");
        return null;
      }
      
      console.log("Found storage buckets:", buckets?.map(b => b.id).join(', '));
    } catch (storageError) {
      console.error("Error checking storage availability:", storageError);
      onError("Unable to access storage service. Image upload has been disabled.");
      return null;
    }
    
    // Upload the file
    const fileExt = imageFile.name.split(".").pop() || 'jpeg';
    const fileName = `${partId}.${fileExt}`;
    const filePath = `parts/${fileName}`;
    
    console.log("Uploading image to path:", filePath);
    
    // Make sure parts directory exists
    try {
      // Try to list the 'parts' directory
      const { data: partsDir, error: listError } = await supabase.storage
        .from("images")
        .list('parts');
        
      // If there's an error or the parts directory doesn't exist, create it
      if (listError || !partsDir || partsDir.length === 0) {
        console.log("Creating parts directory");
        const created = await createPartsDirectory();
        if (!created) {
          onError("Could not create upload directory. Please try again later.");
          return null;
        }
      }
    } catch (dirError) {
      console.log("Error checking parts directory, attempting to create it:", dirError);
      const created = await createPartsDirectory();
      if (!created) {
        onError("Could not create upload directory. Please try again later.");
        return null;
      }
    }
    
    // Upload the actual image file
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
    
    // First, check if storage is available
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage
        .listBuckets();
      
      if (bucketsError || !buckets?.some(bucket => bucket.id === 'images')) {
        console.error("Storage bucket check failed:", bucketsError || "Images bucket not found");
        return null;
      }
    } catch (storageError) {
      console.error("Error checking storage availability:", storageError);
      return null;
    }
    
    console.log("Getting public URL for image:", imagePath);
    
    try {
      const { data } = await supabase.storage
        .from("images")
        .getPublicUrl(imagePath);
      
      if (data?.publicUrl) {
        console.log("Public URL retrieved:", data.publicUrl);
        return data.publicUrl;
      }
    } catch (urlError) {
      console.error("Error getting public URL:", urlError);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting public URL:", error);
    return null;
  }
};

export const deletePartImage = async (imagePath: string): Promise<boolean> => {
  try {
    // First check if storage is available
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage
        .listBuckets();
      
      if (bucketsError || !buckets?.some(bucket => bucket.id === 'images')) {
        console.error("Storage bucket check failed:", bucketsError || "Images bucket not found");
        return false;
      }
    } catch (storageError) {
      console.error("Error checking storage availability:", storageError);
      return false;
    }
    
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
