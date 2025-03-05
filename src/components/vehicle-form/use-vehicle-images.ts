
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/lib/types';
import { ApiError } from '@/lib/api-error-handler';

export function useVehicleImages() {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const uploadVehicleImages = async (vehicleId: string) => {
    if (images.length === 0) return;

    try {
      // Check authentication status before upload
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new ApiError("You must be logged in to upload images", 401);
      }

      const imageUploadPromises = images.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${vehicleId}/${crypto.randomUUID()}.${fileExt}`;

        // First, check if the file already exists
        const { data: existingFile } = await supabase.storage
          .from('vehicle-images')
          .list(vehicleId);

        if (existingFile?.some(f => f.name === fileName)) {
          throw new ApiError('File already exists', 409);
        }

        const { error: uploadError, data } = await supabase.storage
          .from('vehicle-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(imageUploadPromises);

      const imageRecords = uploadedUrls.map(url => ({
        vehicle_id: vehicleId,
        image_url: url
      }));

      const { error: insertError } = await supabase
        .from('vehicle_images')
        .insert(imageRecords);

      if (insertError) throw insertError;

      // Clean up object URLs to prevent memory leaks
      imagePreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      // Reset the image states after successful upload
      setImages([]);
      setImagePreviewUrls([]);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  return {
    images,
    setImages,
    imagePreviewUrls,
    setImagePreviewUrls,
    uploadVehicleImages,
  };
}
