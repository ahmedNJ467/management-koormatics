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
      // Fetch clients and active contracts in parallel
      const [clientsResult, contractsResult] = await Promise.all([
        supabase.from("clients").select("*").order("name"),
        supabase
          .from("contracts")
          .select("client_id, clients:client_id(name)")
          .gte("end_date", new Date().toISOString().split("T")[0])
          .lte("start_date", new Date().toISOString().split("T")[0]),
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (contractsResult.error) {
        console.error(
          "Error fetching active contracts:",
          contractsResult.error
        );
      }

      // Use a Set for efficient look-ups of client IDs that have active contracts
      const clientsWithActiveContracts = new Set(
        (contractsResult.data as any[])?.map(
          (contract) => contract.client_id
        ) || []
      );

      // Add has_active_contract flag to clients
      const clientsWithFlag = (clientsResult.data || []).map((client: any) => ({
        ...client,
        has_active_contract: clientsWithActiveContracts.has(client.id),
      }));

      return clientsWithFlag as Client[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchOnWindowFocus: false,
  });
}
