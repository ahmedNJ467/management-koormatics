
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { tripTypeDisplayMap, extractFlightInfo, TripType } from "@/lib/types/trip";

export function useReportsData() {
  const { toast } = useToast();

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, maintenance(cost, date, description)");

      if (error) throw error;
      return data;
    },
  });

  const { data: fuelData, isLoading: isLoadingFuel } = useQuery({
    queryKey: ["fuel-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select("*, vehicles(make, model)");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ["maintenance-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select("*, vehicles(make, model)");

      if (error) throw error;
      return data;
    },
  });

  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          vehicles(make, model),
          drivers(name),
          clients(name)
        `);

      if (error) throw error;
      
      return data.map((trip: any) => {
        const flightInfo = extractFlightInfo(trip.special_instructions || '');
        
        const displayType = trip.service_type ? 
          tripTypeDisplayMap[trip.service_type as TripType] || trip.service_type : 
          'Other';
        
        return {
          ...trip,
          flight_info: flightInfo,
          display_type: displayType,
          status: trip.status || 'scheduled',
          type: trip.service_type || 'other',
          notes: trip.special_instructions || '',
          start_time: trip.time || '',
          end_time: trip.return_time || ''
        };
      });
    },
  });

  const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["drivers-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  return {
    vehicles: vehiclesData,
    fuelData,
    maintenanceData,
    tripsData,
    driversData,
    isLoadingVehicles,
    isLoadingFuel,
    isLoadingMaintenance,
    isLoadingTrips,
    isLoadingDrivers,
  };
}
