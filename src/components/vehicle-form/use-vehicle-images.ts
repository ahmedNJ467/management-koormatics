
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/lib/types';

export function useVehicleImages() {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const uploadVehicleImages = async (vehicleId: string) => {
    if (images.length === 0) return;

    try {
      const imageUploadPromises = images.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${vehicleId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(filePath);

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
