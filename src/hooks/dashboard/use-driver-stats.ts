
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDriverStats() {
  // Fetch driver statistics
  const { data: driverStats, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["dashboard", "drivers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("status")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        // Calculate driver statistics
        const totalDrivers = data.length;
        const activeDrivers = data.filter(d => d.status === 'active').length;
        const inactiveDrivers = data.filter(d => d.status === 'inactive').length;
        
        return {
          totalDrivers,
          activeDrivers,
          inactiveDrivers
        };
      } catch (error) {
        console.error("Error fetching driver stats:", error);
        toast.error("Failed to load driver statistics");
        return null;
      }
    },
  });

  return { driverStats, isLoadingDrivers };
}
