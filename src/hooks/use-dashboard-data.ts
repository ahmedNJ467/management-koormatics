
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  initialAlerts, 
  initialTrips, 
  initialCostsBreakdown, 
  initialRecentActivities 
} from "@/data/dashboard/mock-data";
import { TripItemProps, AlertItemProps, CostsBreakdownProps, ActivityItemProps } from "@/types/dashboard";

export function useDashboardData() {
  const [recentAlerts] = useState<AlertItemProps[]>(initialAlerts);
  const [upcomingTrips, setUpcomingTrips] = useState<TripItemProps[]>(initialTrips);
  const [costsBreakdown, setCostsBreakdown] = useState<CostsBreakdownProps>(initialCostsBreakdown);
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>(initialRecentActivities);

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

  // Fetch financial data (maintenance and fuel costs)
  const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ["dashboard", "financial"],
    queryFn: async () => {
      try {
        // Get the current date and calculate date 30 days ago
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const formattedToday = today.toISOString().split('T')[0];
        const formattedThirtyDaysAgo = thirtyDaysAgo.toISOString().split('T')[0];
        
        // Fetch maintenance costs for the last 30 days
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from("maintenance")
          .select("cost, date, description")
          .gte("date", formattedThirtyDaysAgo)
          .lte("date", formattedToday);
        
        if (maintenanceError) throw maintenanceError;
        
        // Fetch fuel costs for the last 30 days
        const { data: fuelData, error: fuelError } = await supabase
          .from("fuel_logs")
          .select("cost, date, fuel_type")
          .gte("date", formattedThirtyDaysAgo)
          .lte("date", formattedToday);
        
        if (fuelError) throw fuelError;
        
        // Calculate totals
        const totalMaintenanceCost = maintenanceData.reduce((sum, item) => sum + Number(item.cost), 0);
        const totalFuelCost = fuelData.reduce((sum, item) => sum + Number(item.cost), 0);
        const totalCost = totalMaintenanceCost + totalFuelCost;
        
        // Calculate fuel costs by type
        const fuelByType = fuelData.reduce((acc, item) => {
          const type = item.fuel_type || 'unknown';
          acc[type] = (acc[type] || 0) + Number(item.cost);
          return acc;
        }, {} as Record<string, number>);
        
        // Update costs breakdown state
        setCostsBreakdown({
          maintenance: {
            service: maintenanceData.filter(m => m.description?.toLowerCase().includes('service')).reduce((sum, item) => sum + Number(item.cost), 0),
            repairs: maintenanceData.filter(m => m.description?.toLowerCase().includes('repair')).reduce((sum, item) => sum + Number(item.cost), 0),
            total: totalMaintenanceCost
          },
          fuel: {
            diesel: fuelByType['diesel'] || 0,
            petrol: fuelByType['petrol'] || 0,
            total: totalFuelCost
          }
        });
        
        return {
          totalMaintenanceCost,
          totalFuelCost,
          totalCost,
          fuelByType
        };
      } catch (error) {
        console.error("Error fetching financial data:", error);
        toast.error("Failed to load financial data");
        return null;
      }
    },
  });

  // Fetch upcoming trips
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["dashboard", "trips"],
    queryFn: async () => {
      try {
        // Get the current date
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const formattedToday = today.toISOString().split('T')[0];
        const formattedNextWeek = nextWeek.toISOString().split('T')[0];
        
        // Fetch upcoming trips
        const { data, error } = await supabase
          .from("trips")
          .select(`
            id, date, time, 
            pickup_location, dropoff_location,
            clients(name),
            drivers(name)
          `)
          .gte("date", formattedToday)
          .lte("date", formattedNextWeek)
          .order("date", { ascending: true })
          .limit(5);
        
        if (error) throw error;
        
        // Format trips data
        const formattedTrips: TripItemProps[] = data.map(trip => ({
          id: parseInt(trip.id, 10) || Math.floor(Math.random() * 1000000), // Fallback to random number if parsing fails
          client: trip.clients?.name || 'Unknown Client',
          destination: trip.dropoff_location || 'Not specified',
          date: `${trip.date} ${trip.time || ''}`.trim(),
          driver: trip.drivers?.name || 'Not Assigned'
        }));
        
        // Update upcoming trips state
        setUpcomingTrips(formattedTrips);
        
        return formattedTrips;
      } catch (error) {
        console.error("Error fetching trips data:", error);
        toast.error("Failed to load upcoming trips");
        return [];
      }
    },
  });

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

  return {
    recentAlerts,
    upcomingTrips,
    costsBreakdown,
    recentActivities,
    vehicleStats,
    driverStats,
    financialData,
    isLoadingVehicles,
    isLoadingDrivers,
    isLoadingFinancial,
    isLoadingTrips,
    isLoadingActivity
  };
}
