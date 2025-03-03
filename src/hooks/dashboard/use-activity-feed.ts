
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ActivityItemProps } from "@/types/dashboard";
import { initialRecentActivities } from "@/data/dashboard/mock-data";

export function useActivityFeed() {
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>(initialRecentActivities);

  // Generate activity feed from real-time data
  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: async () => {
      try {
        // Get recent activities from different tables
        const promises = [
          // Get recent trips
          supabase
            .from("trips")
            .select("id, created_at, service_type, clients(name)")
            .order("created_at", { ascending: false })
            .limit(2),
          
          // Get recent maintenance
          supabase
            .from("maintenance")
            .select("id, created_at, description, vehicles(make, model)")
            .order("created_at", { ascending: false })
            .limit(2),
          
          // Get recent fuel logs
          supabase
            .from("fuel_logs")
            .select("id, created_at, vehicles(make, model)")
            .order("created_at", { ascending: false })
            .limit(2)
        ];
        
        const [tripsResult, maintenanceResult, fuelResult] = await Promise.all(promises);
        
        if (tripsResult.error) throw tripsResult.error;
        if (maintenanceResult.error) throw maintenanceResult.error;
        if (fuelResult.error) throw fuelResult.error;
        
        // Format activities
        const tripActivities = (tripsResult.data || []).map(trip => ({
          id: Date.now() + Math.random(),
          title: `New trip created for ${trip.clients?.name || 'a client'}`,
          timestamp: new Date(trip.created_at).toLocaleString(),
          type: "trip" as "trip",
          icon: "Calendar"
        }));
        
        const maintenanceActivities = (maintenanceResult.data || []).map(maintenance => ({
          id: Date.now() + Math.random(),
          title: `Maintenance ${maintenance.description || 'service'} for ${maintenance.vehicles?.make || ''} ${maintenance.vehicles?.model || ''}`,
          timestamp: new Date(maintenance.created_at).toLocaleString(),
          type: "maintenance" as "maintenance",
          icon: "Wrench"
        }));
        
        const fuelActivities = (fuelResult.data || []).map(fuel => ({
          id: Date.now() + Math.random(),
          title: `Fuel added to ${fuel.vehicles?.make || ''} ${fuel.vehicles?.model || ''}`,
          timestamp: new Date(fuel.created_at).toLocaleString(),
          type: "fuel" as "fuel",
          icon: "Fuel"
        }));
        
        // Combine and sort activities
        const allActivities = [...tripActivities, ...maintenanceActivities, ...fuelActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 6);
        
        // Update activities state
        setRecentActivities(allActivities);
        
        return allActivities;
      } catch (error) {
        console.error("Error fetching activity data:", error);
        toast.error("Failed to load activity feed");
        return [];
      }
    },
  });

  return { recentActivities, isLoadingActivity };
}
