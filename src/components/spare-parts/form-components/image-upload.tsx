
import { useState, useEffect } from "react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPublicImageUrl, createPartsDirectory } from "../utils/upload-utils";

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
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  
  // Check if storage is available
  useEffect(() => {
    const checkStorageAvailability = async () => {
      setIsCheckingStorage(true);
      try {
        // Check if buckets are accessible
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error("Storage availability check failed:", error);
          setStorageAvailable(false);
          setImageError("Storage service is not available");
          return;
        }
        
        // Check if images bucket exists
        const hasImagesBucket = buckets?.some(bucket => bucket.id === 'images');
        
        if (!hasImagesBucket) {
          console.warn("Images bucket not available");
          setStorageAvailable(false);
          setImageError("Image uploads are disabled. Storage not configured.");
          return;
        }
        
        // Check if parts directory exists and create it if needed
        try {
          const { data: files, error: dirError } = await supabase.storage
            .from("images")
            .list('parts');
            
          if (dirError || !files || files.length === 0) {
            console.log("Creating parts directory");
            const created = await createPartsDirectory();
            if (!created) {
              setStorageAvailable(false);
              setImageError("Could not create the upload directory");
              return;
            }
          }
        } catch (dirError) {
          console.error("Error checking parts directory:", dirError);
          const created = await createPartsDirectory();
          if (!created) {
            setStorageAvailable(false);
            setImageError("Could not create the upload directory");
            return;
          }
        }
        
        // If we reach here, storage is fully configured
        setStorageAvailable(true);
        setImageError(null);
        
      } catch (error) {
        console.error("Error checking storage:", error);
        setStorageAvailable(false);
        setImageError("Storage service not available");
      } finally {
        setIsCheckingStorage(false);
      }
    };
    
    checkStorageAvailability();
  }, []);
  
  // Fetch existing image preview using useEffect
  useEffect(() => {
    const fetchImage = async () => {
      if (existingImage && storageAvailable) {
        try {
          setIsLoadingImage(true);
          setImageError(null);
          
          console.log("Fetching existing image:", existingImage);
          const publicUrl = await getPublicImageUrl(existingImage);
          
          if (publicUrl) {
            console.log("Setting preview URL to:", publicUrl);
            setPreviewUrl(publicUrl);
          } else {
            throw new Error("Could not get public URL");
          }
        } catch (error) {
          console.error("Error fetching image:", error);
          setImageError("Could not load the existing image");
          toast({
            title: "Image loading error",
            description: "Could not load the existing image. The storage bucket might not be properly configured.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingImage(false);
        }
      } else if (existingImage && !storageAvailable) {
        setImageError("Storage is not available");
        setIsLoadingImage(false);
      }
    };
    
    if (!isCheckingStorage) {
      fetchImage();
    }
  }, [existingImage, setPreviewUrl, toast, storageAvailable, isCheckingStorage]);

  if (isCheckingStorage) {
    return (
      <div className="md:col-span-2">
        <FormLabel htmlFor="part_image">Part Image</FormLabel>
        <div className="mt-1.5 p-4 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
          <p className="text-sm text-slate-600">
            Checking storage availability...
          </p>
        </div>
      </div>
    );
  }

  if (storageAvailable === false) {
    return (
      <div className="md:col-span-2">
        <FormLabel htmlFor="part_image">Part Image</FormLabel>
        <div className="mt-1.5 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-amber-700">
            {imageError || "Image uploads are currently unavailable. The storage service is not properly configured."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:col-span-2">
      <FormLabel htmlFor="part_image">Part Image</FormLabel>
      <div className="mt-1.5 flex items-start gap-4">
        <div className="flex-1 relative">
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
          {!previewUrl && (
            <div className="absolute inset-0 opacity-0 pointer-events-none">
              <Upload className="h-5 w-5" />
            </div>
          )}
        </div>
        
        {isLoadingImage && (
          <div className="h-24 w-24 flex items-center justify-center bg-slate-100 rounded-md">
            <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
          </div>
        )}
        
        {imageError && !isLoadingImage && !previewUrl && (
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
      {imageError && previewUrl && (
        <p className="text-xs text-red-500 mt-1">{imageError}</p>
      )}
    </div>
  );
};
