
import { VehicleCostData } from '@/lib/types/cost-analytics';

export function calculateVehicleCosts(
  maintenanceData: any[] = [], 
  fuelData: any[] = []
): VehicleCostData[] {
  const vehicleCosts: Record<string, VehicleCostData> = {};
  
  if (maintenanceData) {
    maintenanceData.forEach(item => {
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
      
      vehicleCosts[vehicleId].maintenance += Number(item.cost);
    });
  }
  
  if (fuelData) {
    fuelData.forEach(item => {
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
      
      vehicleCosts[vehicleId].fuel += Number(item.cost);
    });
  }
  
  return Object.values(vehicleCosts).map(vehicle => {
    vehicle.total = vehicle.maintenance + vehicle.fuel;
    return vehicle;
  }).sort((a, b) => b.total - a.total);
}
