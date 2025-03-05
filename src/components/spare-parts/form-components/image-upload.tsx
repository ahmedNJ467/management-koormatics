
import { useState, useEffect } from "react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  imageInputRef: any;
  existingImage?: string;
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  form: any;
}

export const ImageUpload = ({ 
  imageInputRef, 
  existingImage, 
  previewUrl, 
  setPreviewUrl, 
  handleImageChange,
  form
}: ImageUploadProps) => {
  
  // Fetch existing image preview using useEffect
  useEffect(() => {
    const fetchImage = async () => {
      if (existingImage) {
        try {
          const { data } = await supabase.storage
            .from("images")
            .getPublicUrl(existingImage);
          
          if (data) {
            setPreviewUrl(data.publicUrl);
          }
        } catch (error) {
          console.error("Error fetching image:", error);
        }
      }
    };
    
    fetchImage();
  }, [existingImage, setPreviewUrl]);

  return (
    <div className="md:col-span-2">
      <FormLabel htmlFor="part_image">Part Image</FormLabel>
      <div className="mt-1.5 flex items-start gap-4">
        <Input
          id="part_image"
          type="file"
          onChange={(e) => {
            imageInputRef.onChange(e);
            handleImageChange(e);
          }}
          ref={imageInputRef.ref}
          onBlur={imageInputRef.onBlur}
          name={imageInputRef.name}
          accept="image/*"
          className="flex-1"
        />
        
        {previewUrl && (
          <div className="relative h-24 w-24 rounded-md overflow-hidden border">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="h-full w-full object-cover" 
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6 rounded-full translate-x-1/3 -translate-y-1/3"
              onClick={() => {
                setPreviewUrl(null);
                form.resetField("part_image");
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
