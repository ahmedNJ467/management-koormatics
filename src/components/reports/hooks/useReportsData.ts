
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SparePart } from "@/components/spare-parts/types";

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
      const { data: parts, error: partsError } = await supabase
        .from("spare_parts")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (partsError) throw partsError;

      // Explicitly type the parts array to include vehicle_id
      const partsWithVehicles = await Promise.all(
        (parts as SparePart[]).map(async (part) => {
          if (part.vehicle_id) {
            const { data: vehicle } = await supabase
              .from("vehicles")
              .select("make, model, registration")
              .eq("id", part.vehicle_id)
              .single();
            
            return { ...part, vehicles: vehicle };
          }
          return { ...part, vehicles: null };
        })
      );
      
      return partsWithVehicles;
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
