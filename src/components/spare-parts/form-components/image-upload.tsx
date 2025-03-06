
import { useState, useEffect } from "react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Fetch existing image preview using useEffect
  useEffect(() => {
    const fetchImage = async () => {
      if (existingImage) {
        try {
          setIsLoadingImage(true);
          setImageError(null);
          
          const { data } = await supabase.storage
            .from("images")
            .getPublicUrl(existingImage);
          
          if (data) {
            setPreviewUrl(data.publicUrl);
          }
        } catch (error) {
          console.error("Error fetching image:", error);
          setImageError("Could not load the existing image");
          toast({
            title: "Image loading error",
            description: "Could not load the existing image",
            variant: "destructive",
          });
        } finally {
          setIsLoadingImage(false);
        }
      }
    };
    
    fetchImage();
  }, [existingImage, setPreviewUrl, toast]);

  return (
    <div className="md:col-span-2">
      <FormLabel htmlFor="part_image">Part Image</FormLabel>
      <div className="mt-1.5 flex items-start gap-4">
        <Input
          id="part_image"
          type="file"
          onChange={(e) => {
            // Important: Call both the ref's onChange and our local handler
            handleImageChange(e);
            const file = e.target.files?.[0];
            if (file) {
              // Validate file size (max 5MB)
              if (file.size > 5 * 1024 * 1024) {
                toast({
                  title: "File too large",
                  description: "Image must be less than 5MB",
                  variant: "destructive",
                });
                e.target.value = '';
                return;
              }
              
              // Validate file type
              if (!file.type.startsWith('image/')) {
                toast({
                  title: "Invalid file type",
                  description: "Please select an image file",
                  variant: "destructive",
                });
                e.target.value = '';
                return;
              }
              
              // Set the file value in the form
              form.setValue("part_image", file);
            }
          }}
          ref={imageInputRef.ref}
          onBlur={imageInputRef.onBlur}
          accept="image/*"
          className="flex-1"
        />
        
        {isLoadingImage && (
          <div className="h-24 w-24 flex items-center justify-center bg-slate-100 rounded-md">
            <p className="text-xs text-slate-500">Loading...</p>
          </div>
        )}
        
        {imageError && !isLoadingImage && (
          <div className="h-24 w-24 flex items-center justify-center bg-red-50 rounded-md">
            <p className="text-xs text-red-500">Failed to load</p>
          </div>
        )}
        
        {previewUrl && !imageError && !isLoadingImage && (
          <div className="relative h-24 w-24 rounded-md overflow-hidden border">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="h-full w-full object-cover" 
              onError={() => {
                setImageError("Image failed to load");
                setPreviewUrl(null);
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6 rounded-full translate-x-1/3 -translate-y-1/3"
              onClick={() => {
                setPreviewUrl(null);
                form.setValue("part_image", null);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      {imageError && (
        <p className="text-xs text-red-500 mt-1">{imageError}</p>
      )}
    </div>
  );
};
