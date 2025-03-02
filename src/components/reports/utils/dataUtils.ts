
// Flatten nested objects for export
export const flattenData = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  return data.map(item => {
    const flattened: Record<string, any> = {};
    
    Object.entries(item).forEach(([key, value]) => {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value as Record<string, any>).forEach(([nestedKey, nestedValue]) => {
          flattened[`${key}_${nestedKey}`] = nestedValue;
        });
      } else {
        flattened[key] = value;
      }
    });
    
    return flattened;
  });
};

// Format client with passengers for export - improved spacious format
export const formatClientWithPassengers = (trip: any) => {
  let clientDisplay = trip.clients?.name || 'N/A';
  
  // Add organization type if available
  if (trip.client_type === 'organization') {
    clientDisplay += '\n(Organization)';
    
    // Add passenger list if available with better spacing
    if (trip.passengers && trip.passengers.length > 0) {
      clientDisplay += '\n\nPassengers:';
      trip.passengers.forEach((passenger: string) => {
        clientDisplay += `\n${passenger}`;
      });
    }
  }
  
  return clientDisplay;
};

// Helper function for vehicle maintenance costs
export const getVehicleMaintenanceCosts = (vehicle: any, data: any[]) => {
  if (!vehicle.maintenance) return 0;
  
  return Array.isArray(vehicle.maintenance)
    ? vehicle.maintenance.reduce((sum, item) => sum + Number(item.cost || 0), 0)
    : 0;
};
