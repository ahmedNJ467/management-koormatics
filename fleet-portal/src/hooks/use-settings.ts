import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface UserSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  theme_preference: "light" | "dark" | "system";
  language: string;
  timezone: string;
  date_format: string;
  currency: string;
  dashboard_refresh_interval: number;
}

export interface SystemSettings {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  default_currency: string;
  timezone: string;
  date_format: string;
  invoice_prefix: string;
  quotation_prefix: string;
  auto_backup: boolean;
  maintenance_mode: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  activity_type: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
}

export function useUserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from("user_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings({
          email_notifications: data.email_notifications ?? true,
          sms_notifications: data.sms_notifications ?? false,
          theme_preference: data.theme_preference ?? "system",
          language: data.language ?? "en",
          timezone: data.timezone ?? "UTC",
          date_format: data.date_format ?? "DD/MM/YYYY",
          currency: data.currency ?? "USD",
          dashboard_refresh_interval: data.dashboard_refresh_interval ?? 30,
        });
      } else {
        // Set default settings if none exist
        setSettings({
          email_notifications: true,
          sms_notifications: false,
          theme_preference: "system",
          language: "en",
          timezone: "UTC",
          date_format: "DD/MM/YYYY",
          currency: "USD",
          dashboard_refresh_interval: 30,
        });
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
      toast({
        title: "Error loading settings",
        description: "Failed to load your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from("user_settings" as any)
        .upsert({
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving user settings:", error);
      toast({
        title: "Error saving settings",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  return {
    settings,
    isLoading,
    saveSettings,
    refetch: loadSettings,
  };
}

export function useSystemSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("system_settings" as any)
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error loading system settings:", error);
      toast({
        title: "Error loading system settings",
        description: "Failed to load system settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const { error } = await (supabase as any)
        .from("system_settings" as any)
        .upsert({
          ...newSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));

      toast({
        title: "System settings saved",
        description: "System configuration has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving system settings:", error);
      toast({
        title: "Error saving system settings",
        description: "Failed to save system settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    saveSettings,
    refetch: loadSettings,
  };
}

export function useApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadApiKeys = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from("user_api_keys" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setApiKeys(data || []);
    } catch (error) {
      console.error("Error loading API keys:", error);
      toast({
        title: "Error loading API keys",
        description: "Failed to load your API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async (name: string = "Default API Key") => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-api-key",
        {
          body: {
            user_id: user.id,
            name: name,
          },
        }
      );

      if (error) throw error;

      await loadApiKeys();

      toast({
        title: "API Key generated",
        description: "Your new API key has been generated successfully.",
      });

      return data.api_key;
    } catch (error) {
      console.error("Error generating API key:", error);
      toast({
        title: "Error generating API key",
        description: "Failed to generate API key. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("user_api_keys" as any)
        .update({ is_active: false })
        .eq("id", keyId);

      if (error) throw error;

      await loadApiKeys();

      toast({
        title: "API Key revoked",
        description: "The API key has been revoked successfully.",
      });
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast({
        title: "Error revoking API key",
        description: "Failed to revoke API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadApiKeys();
  }, [user]);

  return {
    apiKeys,
    isLoading,
    generateApiKey,
    revokeApiKey,
    refetch: loadApiKeys,
  };
}

export function useActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from("user_activity_log" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error("Error loading activity log:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logActivity = async (
    activityType: string,
    description: string,
    metadata?: any
  ) => {
    if (!user) return;

    try {
      await (supabase as any).from("user_activity_log" as any).insert({
        user_id: user.id,
        activity_type: activityType,
        description: description,
        metadata: metadata,
        ip_address: null, // Could be populated from request context
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [user]);

  return {
    activities,
    isLoading,
    logActivity,
    refetch: loadActivities,
  };
}
