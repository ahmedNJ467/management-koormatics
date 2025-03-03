
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboardPerformance } from "../use-dashboard-performance";

export function useVehicleStats() {
  const { startMeasurement, endMeasurement } = useDashboardPerformance();

  // Fetch vehicle statistics
  const { data: vehicleStats, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["dashboard", "vehicles"],
    queryFn: async () => {
      const measurementId = startMeasurement('Vehicle Stats Query', 'query');
      
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
        
        const result = {
          totalVehicles,
          activeVehicles,
          inMaintenance,
          vehicleTypes
        };
        
        // End measurement with data size info
        endMeasurement('Vehicle Stats Query', { 
          dataSize: JSON.stringify(result).length,
          details: `Processed ${data.length} vehicles`
        });
        
        return result;
      } catch (error) {
        console.error("Error fetching vehicle stats:", error);
        toast.error("Failed to load vehicle statistics");
        endMeasurement('Vehicle Stats Query');
        return null;
      }
    },
  });

  return { vehicleStats, isLoadingVehicles };
}
