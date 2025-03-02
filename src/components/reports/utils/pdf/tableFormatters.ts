import { format } from "date-fns";

// Generate table data for different report types
export function generateTableData(data: any[], reportType: string) {
  let tableHeaders: string[] = [];
  let tableData: any[] = [];

  // Format date strings for different reports
  const formatDateString = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return format(dateObj, 'MMM dd, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  switch (reportType) {
    case 'trips-report':
      tableHeaders = ['Date', 'Client', 'Pick-up', 'Drop-off', 'Vehicle', 'Driver', 'Status', 'Amount'];
      tableData = data.map(trip => {
        // Format client information, properly handling organizations with passengers
        let clientDisplay = trip.clients?.name || 'Unknown Client';
        
        // Special formatting for organizations with passengers
        if (trip.clients?.type === 'organization') {
          clientDisplay = `${clientDisplay}\n(Organization)`;
          
          // Add passengers if they exist
          if (trip.passengers && trip.passengers.length > 0) {
            clientDisplay += `\nPassengers: ${trip.passengers.length}`;
            // Add each passenger name on a new line
            trip.passengers.forEach((passenger: string) => {
              clientDisplay += `\n${passenger}`;
            });
          }
        }

        return [
          formatDateString(trip.date),
          clientDisplay,
          trip.pickup_location || 'N/A',
          trip.dropoff_location || 'N/A',
          `${trip.vehicles?.make || ''} ${trip.vehicles?.model || ''}`.trim() || 'N/A',
          trip.drivers?.name || 'Not Assigned',
          trip.status || 'Scheduled',
          `$${Number(trip.amount || 0).toFixed(2)}`
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
