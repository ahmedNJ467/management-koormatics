import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export interface ProfileData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  profile_image_url: string | null;
  notification_preferences?: {
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
  };
  two_factor_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Try to load from Supabase profiles table first
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      if (profileData) {
        // Map Supabase profile to our ProfileData interface
        const p: any = profileData as any;
        const mappedProfile: ProfileData = {
          id: profileData.id,
          name:
            profileData.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
          email: (profileData as any).email || user.email || "",
          phone: p.phone || "",
          address: p.address || "",
          company: p.company || "",
          profile_image_url: (profileData as any).profile_image_url ?? null,
          notification_preferences: (profileData as any).notification_preferences || {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            marketing_emails: false,
          },
          two_factor_enabled: (profileData as any).two_factor_enabled || false,
          created_at: (profileData as any).created_at,
          updated_at: (profileData as any).updated_at,
        };
        setProfile(mappedProfile);
      } else {
        // Create default profile if none exists
        const defaultProfile: ProfileData = {
          id: user.id,
          name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
          email: user.email || "",
          phone: "",
          address: "",
          company: "",
          profile_image_url: null,
          notification_preferences: {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            marketing_emails: false,
          },
          two_factor_enabled: false,
        };
        setProfile(defaultProfile);

        // Save default profile to database
        await saveProfileToDatabase(defaultProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfileToDatabase = async (
    profileData: ProfileData
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: profileData.email,
        full_name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        company: profileData.company,
        profile_image_url: profileData.profile_image_url,
        notification_preferences: profileData.notification_preferences,
        two_factor_enabled: profileData.two_factor_enabled,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error saving profile to database:", error);
      throw error;
    }
  };

  const saveProfile = async (profileData: ProfileData): Promise<boolean> => {
    try {
      setLoading(true);

      // Save to Supabase
      await saveProfileToDatabase(profileData);
      setProfile(profileData);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      // Fallback to base64 for demo purposes
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const changePassword = async (
    passwordData: PasswordChangeData
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });

      return true;
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to change password. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationPreferences = async (
    preferences: ProfileData["notification_preferences"]
  ): Promise<boolean> => {
    if (!profile) return false;

    try {
      const updatedProfile = {
        ...profile,
        notification_preferences: preferences,
      };
      return await saveProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      return false;
    }
  };

  const toggleTwoFactor = async (enabled: boolean): Promise<boolean> => {
    if (!profile) return false;

    try {
      const updatedProfile = { ...profile, two_factor_enabled: enabled };
      return await saveProfile(updatedProfile);
    } catch (error) {
      console.error("Error toggling two-factor authentication:", error);
      return false;
    }
  };

  return {
    profile,
    loading,
    saveProfile,
    uploadProfileImage,
    changePassword,
    updateNotificationPreferences,
    toggleTwoFactor,
    loadProfile,
  };
}
