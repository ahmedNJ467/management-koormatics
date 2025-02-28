
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

  const uploadProfile = async (clientId: string): Promise<string | null> => {
    if (!profileFile) return initialProfileUrl;

    try {
      return await uploadClientFile(
        profileFile,
        "client-profiles",
        clientId,
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
