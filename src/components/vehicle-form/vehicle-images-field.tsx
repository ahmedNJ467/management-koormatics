import { ImagePlus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Vehicle } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VehicleImagesFieldProps {
  vehicle?: Vehicle;
  images: File[];
  setImages: (files: File[]) => void;
  imagePreviewUrls: string[];
  setImagePreviewUrls: (urls: string[]) => void;
}

export function VehicleImagesField({
  vehicle,
  images,
  setImages,
  imagePreviewUrls,
  setImagePreviewUrls,
}: VehicleImagesFieldProps) {
  const { toast } = useToast();
  const [existingImages, setExistingImages] = useState<
    { image_url: string; id?: string }[]
  >([]);

  useEffect(() => {
    if (vehicle?.images) {
      const existingImageUrls = vehicle.images.map((img) => ({
        image_url: img.url,
      }));
      setExistingImages(existingImageUrls);
      setImagePreviewUrls(existingImageUrls.map((img) => img.image_url));
    } else {
      setExistingImages([]);
      setImagePreviewUrls([]);
    }
    setImages([]);
  }, [vehicle, setImages, setImagePreviewUrls]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newImages = [...images, ...files];
    setImages(newImages);

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    const updatedPreviewUrls = [...imagePreviewUrls, ...newPreviewUrls];
    setImagePreviewUrls(updatedPreviewUrls);
  };

  const removeImage = async (index: number) => {
    const imageUrl = imagePreviewUrls[index];

    // Check if this is an existing image from the database
    const existingImageIndex = existingImages.findIndex(
      (img) => img.image_url === imageUrl
    );

    if (existingImageIndex !== -1 && vehicle) {
      try {
        // Update the vehicle's images array by removing the deleted image
        const updatedImages = vehicle.images?.filter(img => img.url !== imageUrl) || [];
        const { error } = await supabase
          .from("vehicles")
          .update({ images: updatedImages })
          .eq("id", vehicle.id as any);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to remove image from database",
            variant: "destructive",
          });
          return;
        }

        // Update local state
        const updatedExistingImages = existingImages.filter(
          (_, i) => i !== existingImageIndex
        );
        setExistingImages(updatedExistingImages);

        toast({
          title: "Success",
          description: "Image removed successfully",
        });
      } catch (error) {
        console.error("Error removing image:", error);
        toast({
          title: "Error",
          description: "Failed to remove image",
          variant: "destructive",
        });
        return;
      }
    } else {
      // This is a new image (File object), just remove from local state
      const fileIndex = index - existingImages.length;
      if (fileIndex >= 0) {
        const updatedImages = images.filter((_, i) => i !== fileIndex);
        setImages(updatedImages);
      }
    }

    // Update preview URLs
    const updatedPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);
    setImagePreviewUrls(updatedPreviewUrls);

    // Clean up object URL if it's a blob URL
    if (imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {imagePreviewUrls.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Vehicle ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border shadow-sm"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1.5 bg-destructive/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ))}
        <label className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all duration-200">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
          <div className="flex flex-col items-center text-center">
            <ImagePlus className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground font-medium">
              Add Images
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Click to upload
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
