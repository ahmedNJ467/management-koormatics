
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
  const [existingImages, setExistingImages] = useState<{ image_url: string; id?: string }[]>([]);

  useEffect(() => {
    if (vehicle?.vehicle_images) {
      const existingImageUrls = vehicle.vehicle_images.map(img => ({ image_url: img.image_url }));
      setExistingImages(existingImageUrls);
      setImagePreviewUrls(existingImageUrls.map(img => img.image_url));
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
    
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    const updatedPreviewUrls = [...imagePreviewUrls, ...newPreviewUrls];
    setImagePreviewUrls(updatedPreviewUrls);
  };

  const removeImage = async (index: number) => {
    const imageUrl = imagePreviewUrls[index];
    
    // Check if this is an existing image from the database
    const existingImageIndex = existingImages.findIndex(img => img.image_url === imageUrl);
    
    if (existingImageIndex !== -1 && vehicle) {
      try {
        // Delete from database
        const { error } = await supabase
          .from('vehicle_images')
          .delete()
          .eq('vehicle_id', vehicle.id)
          .eq('image_url', imageUrl);

        if (error) {
          toast({
            title: "Error",
            description: "Failed to remove image from database",
            variant: "destructive",
          });
          return;
        }

        // Update local state
        const updatedExistingImages = existingImages.filter((_, i) => i !== existingImageIndex);
        setExistingImages(updatedExistingImages);
        
        toast({
          title: "Success",
          description: "Image removed successfully",
        });
      } catch (error) {
        console.error('Error removing image:', error);
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
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Vehicle Images</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {imagePreviewUrls.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Vehicle ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 bg-destructive/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ))}
        <label className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
          <div className="flex flex-col items-center">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mt-2">Add Images</span>
          </div>
        </label>
      </div>
    </div>
  );
}
