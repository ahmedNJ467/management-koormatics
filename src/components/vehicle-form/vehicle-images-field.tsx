
import { ImagePlus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Vehicle } from "@/lib/types";

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
  useEffect(() => {
    if (vehicle?.vehicle_images) {
      setImagePreviewUrls(vehicle.vehicle_images.map(img => img.image_url));
    } else {
      setImagePreviewUrls([]);
    }
    setImages([]);
  }, [vehicle, setImages, setImagePreviewUrls]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages(prev => [...prev, ...files]);
    
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
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
