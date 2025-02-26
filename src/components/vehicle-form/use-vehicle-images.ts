
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/lib/types';

export function useVehicleImages() {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const uploadVehicleImages = async (vehicleId: string) => {
    if (images.length === 0) return;

    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${vehicleId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('vehicle_images')
        .insert([{
          vehicle_id: vehicleId,
          image_url: publicUrl
        }]);

      if (insertError) throw insertError;
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
