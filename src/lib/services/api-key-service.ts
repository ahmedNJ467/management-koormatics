import { supabase } from "@/integrations/supabase/client";

export interface ApiKey {
  id: string;
  name: string;
  key_value: string;
  permissions: string[];
  is_active: boolean;
  expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class ApiKeyService {
  /**
   * Get API key by name
   */
  static async getApiKeyByName(name: string): Promise<string | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("api_keys" as any)
        .select("key_value, is_active, expires_at")
        .eq("name", name)
        .eq("is_active", true)
        .order("created_at", { ascending: false }); // Get the most recent entry

      if (error) {
        // Log the error but don't throw - we'll fall back to environment variables
        console.warn(
          `Could not fetch API key '${name}' from database:`,
          error.message
        );
        return null;
      }

      if (!data || data.length === 0) {
        console.warn(`API key '${name}' not found in database`);
        return null;
      }

      // If there are multiple entries, take the first (most recent) one
      const apiKeyData = data[0];

      // Check if key is expired
      if (
        apiKeyData.expires_at &&
        new Date(apiKeyData.expires_at) < new Date()
      ) {
        console.warn(`API key '${name}' has expired`);
        return null;
      }

      console.log(`✅ Successfully loaded API key '${name}' from database`);
      return apiKeyData.key_value;
    } catch (error) {
      console.warn(`Error fetching API key '${name}' from database:`, error);
      return null;
    }
  }

  /**
   * Get all API keys
   */
  static async getAllApiKeys(): Promise<ApiKey[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("api_keys" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching API keys:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching API keys:", error);
      return [];
    }
  }

  /**
   * Create a new API key
   */
  static async createApiKey(
    name: string,
    keyValue: string,
    permissions: string[] = [],
    expiresAt?: string
  ): Promise<ApiKey | null> {
    try {
      // For now, return null due to schema issues
      console.log(
        "⚠️ Database API key creation disabled - schema not available"
      );
      return null;
    } catch (error) {
      console.error("Error creating API key:", error);
      return null;
    }
  }

  /**
   * Update an API key
   */
  static async updateApiKey(
    id: string,
    updates: Partial<Omit<ApiKey, "id" | "created_at" | "updated_at">>
  ): Promise<ApiKey | null> {
    try {
      console.log("⚠️ Database API key update disabled - schema not available");
      return null;
    } catch (error) {
      console.error("Error updating API key:", error);
      return null;
    }
  }

  /**
   * Deactivate an API key
   */
  static async deactivateApiKey(id: string): Promise<boolean> {
    try {
      console.log(
        "⚠️ Database API key deactivation disabled - schema not available"
      );
      return false;
    } catch (error) {
      console.error("Error deactivating API key:", error);
      return false;
    }
  }

  /**
   * Delete an API key
   */
  static async deleteApiKey(id: string): Promise<boolean> {
    try {
      console.log(
        "⚠️ Database API key deletion disabled - schema not available"
      );
      return false;
    } catch (error) {
      console.error("Error deleting API key:", error);
      return false;
    }
  }
}
