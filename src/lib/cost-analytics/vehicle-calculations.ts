
import { VehicleCostData } from '@/lib/types/cost-analytics';

export function calculateVehicleCosts(
  maintenanceData: any[] = [], 
  fuelData: any[] = []
): VehicleCostData[] {
  const vehicleCosts: Record<string, VehicleCostData> = {};
  
  // Process maintenance data
  if (maintenanceData && maintenanceData.length > 0) {
    maintenanceData.forEach(item => {
      if (!item.vehicle_id) return; // Skip items without vehicle_id
      
      const vehicleId = item.vehicle_id;
      const vehicleName = item.vehicles ? 
        `${item.vehicles.make} ${item.vehicles.model} (${item.vehicles.registration})` : 
        'Unknown Vehicle';
      
      if (!vehicleCosts[vehicleId]) {
        vehicleCosts[vehicleId] = {
          vehicle_id: vehicleId,
          vehicle_name: vehicleName,
          maintenance: 0,
          fuel: 0,
          total: 0
        };
      }
      
      // Ensure cost is treated as a number
      const cost = Number(item.cost) || 0;
      vehicleCosts[vehicleId].maintenance += cost;
    });
  }
  
  // Process fuel data
  if (fuelData && fuelData.length > 0) {
    fuelData.forEach(item => {
      if (!item.vehicle_id) return; // Skip items without vehicle_id
      
      const vehicleId = item.vehicle_id;
      const vehicleName = item.vehicles ? 
        `${item.vehicles.make} ${item.vehicles.model} (${item.vehicles.registration})` : 
        'Unknown Vehicle';
      
      if (!vehicleCosts[vehicleId]) {
        vehicleCosts[vehicleId] = {
          vehicle_id: vehicleId,
          vehicle_name: vehicleName,
          maintenance: 0,
          fuel: 0,
          total: 0
        };
      }
      
      // Ensure cost is treated as a number
      const cost = Number(item.cost) || 0;
      vehicleCosts[vehicleId].fuel += cost;
    });
  }
  
  // Calculate totals and sort by highest total cost
  return Object.values(vehicleCosts)
    .map(vehicle => {
      vehicle.total = vehicle.maintenance + vehicle.fuel;
      return vehicle;
    })
    .sort((a, b) => b.total - a.total);
}
