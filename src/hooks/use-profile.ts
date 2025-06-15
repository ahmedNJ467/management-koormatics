
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfileData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  bio: string;
  profile_image_url: string | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // For now, we'll use localStorage since there's no authentication
      // In a real app, you'd load from Supabase with user authentication
      const savedProfile = localStorage.getItem('fleet_management_profile');
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        setProfile(profileData);
      } else {
        // Set default profile data
        setProfile({
          name: "Admin User",
          email: "admin@fleetmanagement.com",
          phone: "",
          address: "",
          company: "",
          bio: "",
          profile_image_url: null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profileData: ProfileData): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Save to localStorage (in a real app, you'd save to Supabase)
      localStorage.setItem('fleet_management_profile', JSON.stringify(profileData));
      setProfile(profileData);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
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
    try {
      // Convert file to base64 for localStorage storage
      // In a real app, you'd upload to Supabase Storage
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    saveProfile,
    uploadProfileImage,
    loadProfile
  };
}
