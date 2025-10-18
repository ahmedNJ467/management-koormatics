import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Helper function to ensure the parts directory exists in the images bucket
export const createPartsDirectory = async (): Promise<boolean> => {
  try {
    console.log("Checking parts directory access in images bucket");

    // Try to list files in the parts directory to check if we have access
    const { data: existingFiles, error: listError } = await supabase.storage
      .from("images")
      .list("parts", { limit: 1 });

    // If we can list the directory, we have access
    if (!listError) {
      console.log("Parts directory is accessible");
      return true;
    }

    // If listing failed due to RLS, we'll try to upload a test file directly
    // This will help us determine if we can actually upload files
    console.log("Directory listing failed, testing upload capability...");

    // Try to upload a small test file to see if uploads work
    const testFileName = `parts/test-${Date.now()}.txt`;
    const { error: testUploadError } = await supabase.storage
      .from("images")
      .upload(testFileName, new Blob(["test"], { type: "text/plain" }), {
        contentType: "text/plain",
        upsert: true,
      });

    if (!testUploadError) {
      console.log("Upload test successful, parts directory is accessible");
      // Clean up the test file
      await supabase.storage.from("images").remove([testFileName]);
      return true;
    }

    // If upload also fails due to RLS, we'll assume we can't create the directory
    // but we'll still return true to allow the upload process to continue
    // The actual upload will fail with a more specific error message
    if (
      testUploadError.message.includes("row-level security") ||
      testUploadError.message.includes("RLS") ||
      testUploadError.message.includes("permission denied")
    ) {
      console.warn(
        "Storage RLS policies prevent directory creation, but upload may still work"
      );
      return true;
    }

    console.error("Failed to access parts directory:", testUploadError);
    return false;
  } catch (error) {
    console.error("Failed to check parts directory:", error);
    // If there's an error, assume we can continue and let the upload fail gracefully
    return true;
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

    if (!imageFile.type.startsWith("image/")) {
      onError("Selected file is not a valid image format.");
      return null;
    }

    // Upload the actual image file directly to the parts directory
    // No need to create directory first - Supabase will create it automatically
    const fileExt = imageFile.name.split(".").pop() || "jpeg";
    const fileName = `${partId}.${fileExt}`;
    const filePath = `parts/${fileName}`;

    console.log("Uploading image to path:", filePath);

    const { error: uploadError, data } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile, {
        upsert: true,
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);

      // Provide more specific error messages based on the error type
      if (
        uploadError.message.includes("row-level security") ||
        uploadError.message.includes("RLS") ||
        uploadError.message.includes("permission denied")
      ) {
        onError(
          "Storage access denied. Please check your Supabase storage policies."
        );
      } else if (uploadError.message.includes("bucket")) {
        onError(
          "Storage bucket not found. Please ensure the 'images' bucket exists."
        );
      } else {
        onError(`Upload failed: ${uploadError.message}`);
      }
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

export const getPublicImageUrl = async (
  imagePath: string
): Promise<string | null> => {
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

    const { error } = await supabase.storage.from("images").remove([imagePath]);

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
      .from("spare_parts")
      .select("part_image")
      .limit(1);

    const hasPartImageColumn =
      columnCheck && columnCheck.length > 0 && "part_image" in columnCheck[0];

    return hasPartImageColumn || false;
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
      .update({ part_image: filePath } as any)
      .eq("id", partId as any);

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
