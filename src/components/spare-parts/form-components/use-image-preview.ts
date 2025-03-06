
import { useState, useEffect } from 'react';

export const useImagePreview = (existingImage?: string) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.includes('supabase')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    previewUrl,
    setPreviewUrl,
    handleImageChange
  };
};
