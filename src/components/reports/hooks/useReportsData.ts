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

  // Fetch spare parts data with maintenance relationship
  const { data: sparePartsData, isLoading: isLoadingSpareparts } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: async () => {
      // First, fetch all spare parts
      const { data: parts, error: partsError } = await supabase
        .from("spare_parts")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (partsError) throw partsError;

      // Then fetch all maintenance records for lookup
      const { data: maintenanceRecords, error: maintenanceError } = await supabase
        .from("maintenance")
        .select("id, description, vehicle_id");
        
      if (maintenanceError) throw maintenanceError;
      
      // Create a maintenance lookup map
      const maintenanceMap = maintenanceRecords.reduce((acc, record) => {
        acc[record.id] = record;
        return acc;
      }, {});

      // Then fetch all vehicles to use for lookup
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, make, model, registration");
        
      if (vehiclesError) throw vehiclesError;
      
      // Create a vehicles lookup map for faster access
      const vehiclesMap = vehiclesData.reduce((acc, vehicle) => {
        acc[vehicle.id] = vehicle;
        return acc;
      }, {});

      // Combine spare parts with vehicle and maintenance data
      const partsWithRelationships = (parts as SparePart[]).map(part => {
        let vehicleInfo = null;
        
        // Try to get vehicle info directly from part's vehicle_id
        if (part.vehicle_id && vehiclesMap[part.vehicle_id]) {
          vehicleInfo = {
            make: vehiclesMap[part.vehicle_id].make,
            model: vehiclesMap[part.vehicle_id].model,
            registration: vehiclesMap[part.vehicle_id].registration
          };
        } 
        // If no direct vehicle_id, try to get it from the associated maintenance record
        else if (part.maintenance_id && maintenanceMap[part.maintenance_id]) {
          const maintenanceRecord = maintenanceMap[part.maintenance_id];
          if (maintenanceRecord.vehicle_id && vehiclesMap[maintenanceRecord.vehicle_id]) {
            vehicleInfo = {
              make: vehiclesMap[maintenanceRecord.vehicle_id].make,
              model: vehiclesMap[maintenanceRecord.vehicle_id].model,
              registration: vehiclesMap[maintenanceRecord.vehicle_id].registration
            };
          }
        }
        
        return { 
          ...part, 
          vehicles: vehicleInfo
        };
      });
      
      return partsWithRelationships;
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
