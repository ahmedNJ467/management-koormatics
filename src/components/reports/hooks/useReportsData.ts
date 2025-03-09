
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReportsData() {
  // Fetch vehicles data
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  // Fetch fuel logs data
  const { data: fuelData, isLoading: isLoadingFuel } = useQuery({
    queryKey: ["fuel-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select("*, vehicles(make, model, registration)")
        .order("date", { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  // Fetch maintenance data
  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select("*, vehicles(make, model, registration)")
        .order("date", { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  // Fetch trips data
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*, vehicles(make, model, registration), drivers(name), clients(name)")
        .order("date", { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  // Fetch drivers data
  const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  // Fetch spare parts data with new fields
  const { data: sparePartsData, isLoading: isLoadingSpareparts } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("*, vehicles(make, model, registration)")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  return {
    vehicles: vehicles || [],
    fuelData: fuelData || [],
    maintenanceData: maintenanceData || [],
    tripsData: tripsData || [],
    driversData: driversData || [],
    sparePartsData: sparePartsData || [],
    isLoadingVehicles,
    isLoadingFuel,
    isLoadingMaintenance,
    isLoadingTrips,
    isLoadingDrivers,
    isLoadingSpareparts
  };
}
