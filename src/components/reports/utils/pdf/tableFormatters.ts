
import { format } from "date-fns";

// Generate professional table data matching the example format
export function generateTableData(data: any[], reportType: string) {
  let tableHeaders: string[] = [];
  let tableData: any[] = [];

  // Format date consistently
  const formatDateString = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return format(dateObj, 'dd/MM/yyyy');
    } catch (error) {
      return dateStr || '';
    }
  };

  // Format time consistently
  const formatTimeString = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return format(dateObj, 'HH:mm');
    } catch (error) {
      return '';
    }
  };

  // Clean text formatting
  const cleanText = (text: string, maxLength?: number) => {
    if (!text) return '';
    const cleaned = text.trim().toUpperCase();
    return maxLength ? cleaned.substring(0, maxLength) : cleaned;
  };

  switch (reportType) {
    case 'trips-report':
      tableHeaders = ['DATE', 'CLIENT/PASSENGER(S)', 'ORGANISATION', 'CONTACT', 'SERVICE TYPE', 'PICK-UP ADDRESS', 'DROP-OFF ADDRESS', 'TIME', 'CARRIER/FLIGHT #', 'ASSIGNED VEHICLE', 'ASSIGNED DRIVER'];
      tableData = data.map(trip => {
        // Extract client information
        const clientName = trip.clients?.name || '';
        const isOrganization = trip.clients?.type === 'organization';
        
        // Format passengers for organizations
        let passengerText = '';
        if (isOrganization && trip.passengers && trip.passengers.length > 0) {
          passengerText = trip.passengers.slice(0, 3).map((p: string) => cleanText(p, 20)).join(', ');
          if (trip.passengers.length > 3) {
            passengerText += ` +${trip.passengers.length - 3} MORE`;
          }
        }
        
        // Vehicle information
        const vehicleInfo = trip.vehicles ? 
          `${trip.vehicles.make || ''} ${trip.vehicles.model || ''}`.trim().toUpperCase() : '';
        
        return [
          formatDateString(trip.date),
          passengerText || cleanText(clientName, 25),
          isOrganization ? cleanText(clientName, 15) : '',
          trip.clients?.phone || trip.clients?.email || '',
          cleanText(trip.service_type || 'STANDARD', 12),
          cleanText(trip.pickup_location || '', 30),
          cleanText(trip.dropoff_location || '', 30),
          formatTimeString(trip.date),
          cleanText(trip.flight_number || '', 15),
          vehicleInfo,
          cleanText(trip.drivers?.name || '', 20)
        ];
      });
      break;
      
    case 'vehicles-report':
      tableHeaders = ['MAKE & MODEL', 'REGISTRATION', 'TYPE', 'YEAR', 'STATUS', 'INSURANCE EXPIRY'];
      tableData = data.map(vehicle => [
        cleanText(`${vehicle.make || ''} ${vehicle.model || ''}`.trim(), 25),
        cleanText(vehicle.registration || '', 15),
        cleanText(vehicle.type || '', 12),
        vehicle.year ? vehicle.year.toString() : '',
        cleanText(vehicle.status || '', 12),
        vehicle.insurance_expiry ? formatDateString(vehicle.insurance_expiry) : ''
      ]);
      break;

    case 'drivers-report':
      tableHeaders = ['NAME', 'CONTACT', 'LICENSE NUMBER', 'LICENSE TYPE', 'EXPIRY DATE', 'STATUS'];
      tableData = data.map(driver => [
        cleanText(driver.name || '', 25),
        driver.contact || driver.phone || driver.email || '',
        cleanText(driver.license_number || '', 15),
        cleanText(driver.license_type || '', 12),
        driver.license_expiry ? formatDateString(driver.license_expiry) : '',
        cleanText(driver.status || '', 12)
      ]);
      break;

    case 'fuel-report':
      tableHeaders = ['DATE', 'VEHICLE', 'FUEL TYPE', 'VOLUME (L)', 'COST', 'MILEAGE', 'EFFICIENCY'];
      tableData = data.map(fuelLog => {
        const volume = Number(fuelLog.volume || 0);
        const cost = Number(fuelLog.cost || 0);
        const efficiency = volume > 0 ? `${(cost / volume).toFixed(2)} $/L` : '';
        
        return [
          formatDateString(fuelLog.date),
          fuelLog.vehicles ? cleanText(`${fuelLog.vehicles.make || ''} ${fuelLog.vehicles.model || ''}`.trim(), 20) : '',
          cleanText(fuelLog.fuel_type || 'REGULAR', 10),
          volume.toFixed(1),
          `$${cost.toFixed(2)}`,
          fuelLog.mileage ? fuelLog.mileage.toLocaleString() : '',
          efficiency
        ];
      });
      break;

    case 'maintenance-report':
      tableHeaders = ['DATE', 'VEHICLE', 'SERVICE DESCRIPTION', 'STATUS', 'COST', 'PROVIDER'];
      tableData = data.map(maintenance => [
        formatDateString(maintenance.date),
        maintenance.vehicles ? cleanText(`${maintenance.vehicles.make || ''} ${maintenance.vehicles.model || ''}`.trim(), 20) : '',
        cleanText(maintenance.description || '', 35),
        cleanText(maintenance.status || '', 12),
        `$${Number(maintenance.cost || 0).toFixed(2)}`,
        cleanText(maintenance.service_provider || 'INTERNAL', 15)
      ]);
      break;

    default:
      // Generic handling for unknown report types
      if (data.length > 0) {
        const firstItem = data[0];
        tableHeaders = Object.keys(firstItem).map(key => 
          cleanText(key.replace(/_/g, ' '))
        );
        tableData = data.map(item => 
          Object.values(item).map(value => 
            value !== null && value !== undefined ? cleanText(String(value), 25) : ''
          )
        );
      }
      break;
  }

  return { tableHeaders, tableData };
}
