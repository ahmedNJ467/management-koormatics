import { supabase } from "@/integrations/supabase/client";
import {
  InterestPoint,
  CreateInterestPointData,
  UpdateInterestPointData,
} from "@/lib/types/interest-point";

export class InterestPointService {
  static async getAllInterestPoints(): Promise<InterestPoint[]> {
    try {
      // Check if supabase client is properly configured
      if (!supabase) {
        throw new Error("Supabase client is not configured");
      }

      const { data, error } = await supabase
        .from("interest_points" as any)
        .select("*")
        .eq("is_active", true as any)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      return (data || []) as unknown as InterestPoint[];
    } catch (error) {
      console.error("Error fetching interest points:", error);

      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes("JWT")) {
          throw new Error(
            "Authentication error: Please check your Supabase credentials"
          );
        } else if (
          error.message.includes("relation") ||
          error.message.includes("table")
        ) {
          throw new Error(
            "Database table not found: Please run the interest points migration first"
          );
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          throw new Error(
            "Network error: Please check your internet connection and Supabase URL"
          );
        }
      }

      throw error;
    }
  }

  static async getInterestPointsByCategory(
    category: string
  ): Promise<InterestPoint[]> {
    try {
      const { data, error } = await supabase
        .from("interest_points" as any)
        .select("*")
        .eq("category", category as any)
        .eq("is_active", true as any)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as InterestPoint[];
    } catch (error) {
      console.error("Error fetching interest points by category:", error);
      throw error;
    }
  }

  static async getInterestPointById(id: string): Promise<InterestPoint | null> {
    try {
      const { data, error } = await supabase
        .from("interest_points" as any)
        .select("*")
        .eq("id", id as any)
        .single();

      if (error) throw error;
      return (data as unknown as InterestPoint) || null;
    } catch (error) {
      console.error("Error fetching interest point by ID:", error);
      throw error;
    }
  }

  static async createInterestPoint(
    pointData: CreateInterestPointData
  ): Promise<InterestPoint> {
    try {
      console.log("Creating interest point with data:", pointData);

      // Validate required fields
      if (!pointData.name || !pointData.name.trim()) {
        throw new Error("Interest point name is required");
      }

      // Convert coordinates to numbers if they're strings
      const latitude =
        typeof pointData.latitude === "string"
          ? parseFloat(pointData.latitude)
          : pointData.latitude;
      const longitude =
        typeof pointData.longitude === "string"
          ? parseFloat(pointData.longitude)
          : pointData.longitude;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        isNaN(latitude) ||
        isNaN(longitude)
      ) {
        throw new Error("Valid latitude and longitude are required");
      }

      if (!pointData.category) {
        throw new Error("Category is required");
      }

      // Get current user ID for created_by field
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Prepare data for insertion
      const insertData = {
        name: pointData.name.trim(),
        description: pointData.description?.trim() || null,
        category: pointData.category,
        latitude: latitude,
        longitude: longitude,
        icon_url: pointData.icon_url || null,
        is_active: true,
        created_by: user?.id || null, // Set to current user ID or null
      };

      console.log("Inserting data:", insertData);

      const { data, error } = await supabase
        .from("interest_points" as any)
        .insert([insertData] as any)
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        });
        throw error;
      }

      console.log("Successfully created interest point:", data);
      return (data as unknown as InterestPoint) || null;
    } catch (error) {
      console.error("Error creating interest point:", {
        error,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name,
        errorMessage: (error as Error)?.message,
        errorStack: (error as Error)?.stack,
        stringified: JSON.stringify(error, null, 2),
      });

      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes("JWT")) {
          throw new Error(
            "Authentication error: Please check your Supabase credentials"
          );
        } else if (error.message.includes("permission")) {
          throw new Error(
            "Permission denied: You don't have permission to create interest points"
          );
        } else if (
          error.message.includes("relation") ||
          error.message.includes("table")
        ) {
          throw new Error(
            "Database table not found: Please run the interest points migration first"
          );
        } else if (
          error.message.includes("duplicate") ||
          error.message.includes("unique")
        ) {
          throw new Error(
            "Duplicate entry: An interest point with this name already exists"
          );
        }
      }

      throw error;
    }
  }

  static async updateInterestPoint(
    id: string,
    updateData: UpdateInterestPointData
  ): Promise<InterestPoint> {
    try {
      const { data, error } = await supabase
        .from("interest_points" as any)
        .update(updateData as any)
        .eq("id", id as any)
        .select()
        .single();

      if (error) throw error;
      return (data as unknown as InterestPoint) || null;
    } catch (error) {
      console.error("Error updating interest point:", error);
      throw error;
    }
  }

  static async deleteInterestPoint(id: string): Promise<void> {
    try {
      console.log("Attempting to delete interest point with ID:", id);

      const { data, error } = await supabase
        .from("interest_points" as any)
        .delete()
        .eq("id", id as any)
        .select();

      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }

      console.log("Delete operation result:", data);
    } catch (error) {
      console.error("Error deleting interest point:", error);

      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes("JWT")) {
          throw new Error(
            "Authentication error: Please check your Supabase credentials"
          );
        } else if (error.message.includes("permission")) {
          throw new Error(
            "Permission denied: You don't have permission to delete this interest point"
          );
        } else if (
          error.message.includes("relation") ||
          error.message.includes("table")
        ) {
          throw new Error(
            "Database table not found: Please run the interest points migration first"
          );
        }
      }

      throw error;
    }
  }

  static async deactivateInterestPoint(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("interest_points" as any)
        .update({ is_active: false } as any)
        .eq("id", id as any);

      if (error) throw error;
    } catch (error) {
      console.error("Error deactivating interest point:", error);
      throw error;
    }
  }

  static async searchInterestPoints(query: string): Promise<InterestPoint[]> {
    try {
      const { data, error } = await supabase
        .from("interest_points" as any)
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("is_active", true as any)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as InterestPoint[];
    } catch (error) {
      console.error("Error searching interest points:", error);
      throw error;
    }
  }

  static async getInterestPointsInBounds(
    north: number,
    south: number,
    east: number,
    west: number
  ): Promise<InterestPoint[]> {
    try {
      const { data, error } = await supabase
        .from("interest_points" as any)
        .select("*")
        .gte("latitude", south)
        .lte("latitude", north)
        .gte("longitude", west)
        .lte("longitude", east)
        .eq("is_active", true as any)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as InterestPoint[];
    } catch (error) {
      console.error("Error fetching interest points in bounds:", error);
      throw error;
    }
  }
}
