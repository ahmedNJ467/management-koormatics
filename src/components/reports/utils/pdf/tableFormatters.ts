
import { format } from "date-fns";

// Generate table data for different report types
export function generateTableData(data: any[], reportType: string) {
  let tableHeaders: string[] = [];
  let tableData: any[] = [];

  // Format date strings for different reports
  const formatDateString = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return format(dateObj, 'MM/dd/yyyy'); // More compact date format
    } catch (error) {
      return dateStr;
    }
  };

  switch (reportType) {
    case 'trips-report':
      tableHeaders = ['Date', 'Client', 'Service Type', 'Pick-up', 'Drop-off', 'Vehicle', 'Driver', 'Status'];
      tableData = data.map(trip => {
        // Format client information, properly handling organizations with passengers
        let clientDisplay = trip.clients?.name || 'Unknown Client';
        
        // Special formatting for organizations with passengers
        if (trip.clients?.type === 'organization') {
          // We're removing the organization label and passenger count
          // Just add the passenger names directly if they exist
          if (trip.passengers && trip.passengers.length > 0) {
            // Add each passenger name on a new line
            trip.passengers.forEach((passenger: string) => {
              clientDisplay += `\n${passenger}`;
            });
          }
        }

        // Format date for better readability with more compact format
        const formattedDate = formatDateString(trip.date);
        
        // Compact the service type display to reduce space between columns
        const serviceType = (trip.display_type || trip.service_type || 'N/A');
        
        // Format other fields for consistency and compactness
        const pickupLocation = trip.pickup_location || 'N/A';
        const dropoffLocation = trip.dropoff_location || 'N/A';
        
        // Make vehicle name more compact
        const vehicle = trip.vehicles ? 
          (trip.vehicles.make && trip.vehicles.model ? 
           `${trip.vehicles.make.substring(0, 8)} ${trip.vehicles.model.substring(0, 5)}` : 
           (trip.vehicles.make || trip.vehicles.model || 'N/A')).trim() : 
          'N/A';
          
        const driver = trip.drivers?.name || 'Not Assigned';
        const status = trip.status || 'Scheduled';

        return [
          formattedDate,
          clientDisplay,
          serviceType,
          pickupLocation,
          dropoffLocation,
          vehicle,
          driver,
          status
        ];
      });
      break;
      
    case 'vehicles-report':
      tableHeaders = ['Make', 'Model', 'Registration', 'Type', 'Status', 'Insurance Expiry', 'Notes'];
      tableData = data.map(vehicle => [
        vehicle.make || 'N/A',
        vehicle.model || 'N/A',
        vehicle.registration || 'N/A',
        vehicle.type || 'N/A',
        vehicle.status || 'N/A',
        formatDateString(vehicle.insurance_expiry) || 'N/A',
        vehicle.notes || 'N/A'
      ]);
      break;

    case 'drivers-report':
      tableHeaders = ['Name', 'Contact', 'License Number', 'License Expiry', 'Status'];
      tableData = data.map(driver => [
        driver.name || 'N/A',
        driver.contact || 'N/A',
        driver.license_number || 'N/A',
        formatDateString(driver.license_expiry) || 'N/A',
        driver.status || 'N/A'
      ]);
      break;

    case 'fuel-report':
      tableHeaders = ['Date', 'Vehicle', 'Fuel Type', 'Volume', 'Cost', 'Mileage', 'Notes'];
      tableData = data.map(fuelLog => [
        formatDateString(fuelLog.date),
        `${fuelLog.vehicles?.make || ''} ${fuelLog.vehicles?.model || ''}`.trim() || 'N/A',
        fuelLog.fuel_type || 'N/A',
        fuelLog.volume || 'N/A',
        `$${Number(fuelLog.cost || 0).toFixed(2)}`,
        fuelLog.mileage || 'N/A',
        fuelLog.notes || 'N/A'
      ]);
      break;

    case 'maintenance-report':
      tableHeaders = ['Date', 'Vehicle', 'Description', 'Status', 'Cost', 'Service Provider', 'Next Scheduled'];
      tableData = data.map(maintenance => [
        formatDateString(maintenance.date),
        `${maintenance.vehicles?.make || ''} ${maintenance.vehicles?.model || ''}`.trim() || 'N/A',
        maintenance.description || 'N/A',
        maintenance.status || 'N/A',
        `$${Number(maintenance.cost || 0).toFixed(2)}`,
        maintenance.service_provider || 'N/A',
        formatDateString(maintenance.next_scheduled) || 'N/A'
      ]);
      break;

    default:
      console.warn(`Unknown report type: ${reportType}`);
      break;
  }

  return { tableHeaders, tableData };
}
