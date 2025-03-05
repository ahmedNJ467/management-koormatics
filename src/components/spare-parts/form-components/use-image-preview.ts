
import { useState } from 'react';

export const useImagePreview = (existingImage?: string) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return {
    previewUrl,
    setPreviewUrl,
    handleImageChange
  };
};
