import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Maintenance } from "@/lib/types/maintenance";

export function useMaintenanceData() {
  return useQuery<Maintenance[]>({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select(
          `
          id,
          vehicle_id,
          date,
          description,
          expense,
          status,
          service_provider,
          notes,
          created_at,
          updated_at,
          next_scheduled,
          vehicles!maintenance_vehicle_id_fkey (
            id,
            make,
            model,
            registration
          )
        `
        )
        .order("date", { ascending: false });

      if (error) throw error;

      // Transform the data to match the Maintenance type
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        status: item.status || ("scheduled" as const), // Provide default status
        expense: item.expense || 0, // Ensure expense is a number
        vehicle: item.vehicles || null, // Map vehicles to vehicle to match type
      }));

      return transformedData;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchOnWindowFocus: false,
  });
}
