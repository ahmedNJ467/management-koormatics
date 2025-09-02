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
      const { data, error } = await supabase
        .from("interest_points" as any)
        .insert([pointData] as any)
        .select()
        .single();

      if (error) throw error;
      return (data as unknown as InterestPoint) || null;
    } catch (error) {
      console.error("Error creating interest point:", error);
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
      const { error } = await supabase
        .from("interest_points" as any)
        .delete()
        .eq("id", id as any);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting interest point:", error);
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
