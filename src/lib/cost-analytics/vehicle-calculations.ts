
import { VehicleCostData } from '@/lib/types/cost-analytics';

export function calculateVehicleCosts(
  maintenanceData: any[] = [], 
  fuelData: any[] = []
): VehicleCostData[] {
  const vehicleCosts: Record<string, VehicleCostData> = {};
  
  // Process maintenance data by vehicle
  if (maintenanceData) {
    // Filter to only include completed maintenance
    const completedMaintenance = maintenanceData.filter(
      item => item?.status === 'completed'
    );
    
    completedMaintenance.forEach(item => {
      const vehicleId = item.vehicle_id;
      if (!vehicleId) return;
      
      const vehicleName = item.vehicles ? 
        `${item.vehicles.make} ${item.vehicles.model} - ${item.vehicles.registration}` : 
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
      
      vehicleCosts[vehicleId].maintenance += Number(item.cost || 0);
    });
  }
  
  // Process fuel data by vehicle
  if (fuelData) {
    fuelData.forEach(item => {
      const vehicleId = item.vehicle_id;
      if (!vehicleId) return;
      
      const vehicleName = item.vehicles ? 
        `${item.vehicles.make} ${item.vehicles.model} - ${item.vehicles.registration}` : 
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
      
      vehicleCosts[vehicleId].fuel += Number(item.cost || 0);
    });
  }
  
  // Calculate totals for each vehicle
  Object.values(vehicleCosts).forEach(vehicle => {
    vehicle.total = vehicle.maintenance + vehicle.fuel;
  });
  
  return Object.values(vehicleCosts).sort((a, b) => b.total - a.total);
}
