
import { format } from "date-fns";

// Generate table data for different report types with enhanced formatting
export function generateTableData(data: any[], reportType: string) {
  let tableHeaders: string[] = [];
  let tableData: any[] = [];

  // Format date strings consistently across all reports
  const formatDateString = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return format(dateObj, 'MM/dd/yyyy');
    } catch (error) {
      return dateStr || 'N/A';
    }
  };

  // Format currency values consistently
  const formatCurrency = (amount: any) => {
    const num = Number(amount || 0);
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format status with proper capitalization
  const formatStatus = (status: string) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  switch (reportType) {
    case 'trips-report':
      tableHeaders = ['Date', 'Client', 'Service Type', 'Pick-up Location', 'Drop-off Location', 'Vehicle', 'Driver', 'Status'];
      tableData = data.map(trip => {
        // Enhanced client formatting for organizations with passengers
        let clientDisplay = trip.clients?.name || 'Unknown Client';
        
        if (trip.clients?.type === 'organization') {
          clientDisplay = `${clientDisplay} (Organization)`;
          if (trip.passengers && trip.passengers.length > 0) {
            clientDisplay += `\nPassengers: ${trip.passengers.length}`;
            trip.passengers.forEach((passenger: string, index: number) => {
              if (index < 3) { // Limit to first 3 passengers to avoid overcrowding
                clientDisplay += `\n${passenger}`;
              }
            });
            if (trip.passengers.length > 3) {
              clientDisplay += `\n... and ${trip.passengers.length - 3} more`;
            }
          }
        }

        return [
          formatDateString(trip.date),
          clientDisplay,
          trip.display_type || trip.service_type || 'Standard Service',
          trip.pickup_location || 'Not specified',
          trip.dropoff_location || 'Not specified',
          trip.vehicles ? `${trip.vehicles.make || ''} ${trip.vehicles.model || ''}`.trim() || 'Unassigned' : 'Unassigned',
          trip.drivers?.name || 'Not assigned',
          formatStatus(trip.status || 'scheduled')
        ];
      });
      break;
      
    case 'vehicles-report':
      tableHeaders = ['Make & Model', 'Registration', 'Type', 'Year', 'Status', 'Insurance Expiry'];
      tableData = data.map(vehicle => [
        `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle',
        vehicle.registration || 'Not registered',
        vehicle.type || 'Unknown',
        vehicle.year ? vehicle.year.toString() : 'Unknown',
        formatStatus(vehicle.status || 'unknown'),
        vehicle.insurance_expiry ? formatDateString(vehicle.insurance_expiry) : 'Not set'
      ]);
      break;

    case 'drivers-report':
      tableHeaders = ['Name', 'Contact Information', 'License Number', 'License Type', 'Expiry Date', 'Status'];
      tableData = data.map(driver => [
        driver.name || 'Unknown Driver',
        driver.contact || driver.phone || driver.email || 'No contact info',
        driver.license_number || 'Not provided',
        driver.license_type || 'Standard',
        driver.license_expiry ? formatDateString(driver.license_expiry) : 'Not set',
        formatStatus(driver.status || 'unknown')
      ]);
      break;

    case 'fuel-report':
      tableHeaders = ['Date', 'Vehicle', 'Fuel Type', 'Volume (L)', 'Cost', 'Mileage (km)', 'Efficiency'];
      tableData = data.map(fuelLog => {
        const volume = Number(fuelLog.volume || 0);
        const cost = Number(fuelLog.cost || 0);
        const efficiency = volume > 0 ? `${(cost / volume).toFixed(2)} $/L` : 'N/A';
        
        return [
          formatDateString(fuelLog.date),
          fuelLog.vehicles ? `${fuelLog.vehicles.make || ''} ${fuelLog.vehicles.model || ''}`.trim() || 'Unknown' : 'Unknown',
          fuelLog.fuel_type || 'Regular',
          volume.toFixed(1),
          formatCurrency(cost),
          fuelLog.mileage ? fuelLog.mileage.toLocaleString() : 'Not recorded',
          efficiency
        ];
      });
      break;

    case 'maintenance-report':
      tableHeaders = ['Date', 'Vehicle', 'Service Description', 'Status', 'Cost', 'Service Provider'];
      tableData = data.map(maintenance => [
        formatDateString(maintenance.date),
        maintenance.vehicles ? `${maintenance.vehicles.make || ''} ${maintenance.vehicles.model || ''}`.trim() || 'Unknown' : 'Unknown',
        maintenance.description || 'General maintenance',
        formatStatus(maintenance.status || 'scheduled'),
        formatCurrency(maintenance.cost),
        maintenance.service_provider || 'Internal'
      ]);
      break;

    case 'financial-report':
      tableHeaders = ['Period', 'Revenue', 'Fuel Costs', 'Maintenance Costs', 'Net Profit', 'Profit Margin'];
      tableData = data.map(financial => {
        const revenue = Number(financial.revenue || 0);
        const costs = Number(financial.costs || 0);
        const profit = revenue - costs;
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) + '%' : '0%';
        
        return [
          financial.period || 'Unknown',
          formatCurrency(revenue),
          formatCurrency(financial.fuelCosts || 0),
          formatCurrency(financial.maintenanceCosts || 0),
          formatCurrency(profit),
          margin
        ];
      });
      break;

    default:
      console.warn(`Unknown report type: ${reportType}`);
      // Fallback for unknown report types
      if (data.length > 0) {
        const firstItem = data[0];
        tableHeaders = Object.keys(firstItem).map(key => 
          key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        );
        tableData = data.map(item => 
          Object.values(item).map(value => 
            value !== null && value !== undefined ? String(value) : 'N/A'
          )
        );
      }
      break;
  }

  return { tableHeaders, tableData };
}
