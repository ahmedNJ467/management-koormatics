import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SparePart } from "@/components/spare-parts/types";
import { safeArrayResult } from "@/lib/utils/type-guards";

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
    },
  });

  // Fetch fuel logs data
  const { data: fuelData, isLoading: isLoadingFuel } = useQuery({
    queryKey: ["fuel-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .select(
          "*, vehicles!fuel_logs_vehicle_id_fkey(make, model, registration)"
        )
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch maintenance data
  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useQuery({
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
          vehicles!maintenance_vehicle_id_fkey(make, model, registration)
        `
        )
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch trips data
  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        // Explicitly join via trips_vehicle_id_fkey to avoid ambiguity when multiple relationships exist
        .select(
          "*, vehicles!trips_vehicle_id_fkey(make, model, registration), drivers!trips_driver_id_fkey(name), clients!trips_client_id_fkey(name)"
        )
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch drivers data
  const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name, contact, location, license_number, license_type, license_expiry, status, is_vip, avatar_url, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
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
      const { data: maintenanceRecords, error: maintenanceError } =
        await supabase
          .from("maintenance")
          .select(
            "id, description, vehicle_id, vehicles!maintenance_vehicle_id_fkey(make, model, registration)"
          );

      if (maintenanceError) throw maintenanceError;

      // Create a maintenance lookup map
      const maintenanceMap: Record<string, any> = {};
      if (maintenanceRecords && Array.isArray(maintenanceRecords)) {
        maintenanceRecords.forEach((record: any) => {
          if (record && record.id) {
            maintenanceMap[record.id] = record;
          }
        });
      }

      // Manual lookup for vehicle data
      const vehiclesMap: Record<string, any> = {};
      if (vehicles && Array.isArray(vehicles)) {
        vehicles.forEach((vehicle: any) => {
          if (vehicle && vehicle.id) {
            vehiclesMap[vehicle.id] = vehicle;
          }
        });
      }

      // Combine spare parts with vehicle and maintenance data
      const partsWithRelationships = safeArrayResult<SparePart>(parts).map(
        (part: SparePart) => {
          let vehicleInfo = null;

          // Try to get vehicle info directly from part's vehicle_id
          if (part.vehicle_id && vehiclesMap[part.vehicle_id]) {
            vehicleInfo = {
              make: vehiclesMap[part.vehicle_id].make,
              model: vehiclesMap[part.vehicle_id].model,
              registration: vehiclesMap[part.vehicle_id].registration,
            };
          }
          // If no direct vehicle_id, try to get it from the associated maintenance record
          else if (part.maintenance_id && maintenanceMap[part.maintenance_id]) {
            const maintenanceRecord = maintenanceMap[part.maintenance_id];
            if (maintenanceRecord.vehicles) {
              vehicleInfo = maintenanceRecord.vehicles;
            }
          }

          return {
            ...part,
            vehicles: vehicleInfo,
          };
        }
      );

      return partsWithRelationships;
    },
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
    isLoadingSpareparts,
  };
}
