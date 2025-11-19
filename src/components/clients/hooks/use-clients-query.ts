import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  name: string;
  type: "organization" | "individual";
  description?: string;
  website?: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
  profile_image_url?: string;
  is_archived?: boolean;
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  created_at?: string;
  updated_at?: string;
  has_active_contract?: boolean;
}

export function useClientsQuery() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      // Fetch clients first (don't wait for contracts if it fails)
      const clientsResult = await supabase
        .from("clients")
        .select("*")
        .order("name");

      if (clientsResult.error) throw clientsResult.error;

      // Try to fetch active contracts, but don't fail if it errors
      let clientsWithActiveContracts = new Set<string>();
      try {
        const contractsResult = await supabase
          .from("contracts")
          .select("client_id")
          .lte("start_date", today)
          .gte("end_date", today);

        if (contractsResult.data && !contractsResult.error) {
          clientsWithActiveContracts = new Set(
            contractsResult.data.map((contract: any) => contract.client_id).filter(Boolean)
          );
        }
      } catch (error) {
        console.warn("Error fetching active contracts (non-critical):", error);
        // Continue without contract data
      }

      // Add has_active_contract flag to clients
      const clientsWithFlag = (clientsResult.data || []).map((client: any) => ({
        ...client,
        has_active_contract: clientsWithActiveContracts.has(client.id),
      }));

      return clientsWithFlag as Client[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - show cached data immediately
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchOnMount: false, // Use cached data first, then refetch in background
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid delays
    refetchOnReconnect: true, // Only refetch when network reconnects
    placeholderData: (previousData) => previousData, // Show previous data while fetching
  });
}
