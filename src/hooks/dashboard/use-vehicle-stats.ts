
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useVehicleStats() {
  // Fetch vehicle statistics
  const { data: vehicleStats, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["dashboard", "vehicles"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("status, type")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        // Calculate vehicle statistics
        const totalVehicles = data.length;
        const activeVehicles = data.filter(v => v.status === 'active').length;
        const inMaintenance = data.filter(v => v.status === 'in_service').length;
        const vehicleTypes = data.reduce((acc, vehicle) => {
          acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          totalVehicles,
          activeVehicles,
          inMaintenance,
          vehicleTypes
        };
      } catch (error) {
        console.error("Error fetching vehicle stats:", error);
        toast.error("Failed to load vehicle statistics");
        return null;
      }
    },
  });

  return { vehicleStats, isLoadingVehicles };
}
