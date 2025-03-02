
import { useState } from "react";
import { uploadClientFile } from "./use-client-uploads";

export function useClientProfile(initialProfileUrl: string | null = null) {
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(initialProfileUrl);

  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const objectUrl = URL.createObjectURL(file);
      setProfilePreview(objectUrl);
    }
  };

  const uploadProfile = async (file: File): Promise<string | null> => {
    if (!file) return initialProfileUrl;

    try {
      // Generate a client ID if one isn't provided - this is for new client creation
      const tempClientId = crypto.randomUUID();
      return await uploadClientFile(
        file,
        "client-profiles",
        tempClientId,
        "profile"
      );
    } catch (error) {
      console.error("Profile upload error:", error);
      throw error;
    }
  };

  const resetProfile = (newProfileUrl: string | null = null) => {
    setProfileFile(null);
    setProfilePreview(newProfileUrl);
  };

  return {
    profileFile,
    profilePreview,
    handleProfileChange,
    uploadProfile,
    resetProfile
  };
}
