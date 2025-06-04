
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

  // Truncate text to prevent overflow
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  };

  switch (reportType) {
    case 'trips-report':
      tableHeaders = ['Date', 'Client', 'Service', 'Pick-up', 'Drop-off', 'Vehicle', 'Driver', 'Status'];
      tableData = data.map(trip => {
        // Enhanced client formatting for organizations with passengers
        let clientDisplay = trip.clients?.name || 'Unknown Client';
        
        if (trip.clients?.type === 'organization') {
          clientDisplay = `${truncateText(clientDisplay, 20)} (Org)`;
          if (trip.passengers && trip.passengers.length > 0) {
            clientDisplay += `\nPassengers: ${trip.passengers.length}`;
            // Show only first 2 passengers to prevent overflow
            trip.passengers.slice(0, 2).forEach((passenger: string) => {
              clientDisplay += `\n• ${truncateText(passenger, 15)}`;
            });
            if (trip.passengers.length > 2) {
              clientDisplay += `\n... +${trip.passengers.length - 2} more`;
            }
          }
        } else {
          clientDisplay = truncateText(clientDisplay, 25);
        }

        return [
          formatDateString(trip.date),
          clientDisplay,
          truncateText(trip.display_type || trip.service_type || 'Standard', 12),
          truncateText(trip.pickup_location || 'Not specified', 18),
          truncateText(trip.dropoff_location || 'Not specified', 18),
          trip.vehicles ? truncateText(`${trip.vehicles.make || ''} ${trip.vehicles.model || ''}`.trim(), 12) || 'Unassigned' : 'Unassigned',
          truncateText(trip.drivers?.name || 'Not assigned', 12),
          formatStatus(trip.status || 'scheduled')
        ];
      });
      break;
      
    case 'vehicles-report':
      tableHeaders = ['Make & Model', 'Registration', 'Type', 'Year', 'Status', 'Insurance Expiry'];
      tableData = data.map(vehicle => [
        truncateText(`${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle', 20),
        truncateText(vehicle.registration || 'Not registered', 15),
        truncateText(vehicle.type || 'Unknown', 12),
        vehicle.year ? vehicle.year.toString() : 'Unknown',
        formatStatus(vehicle.status || 'unknown'),
        vehicle.insurance_expiry ? formatDateString(vehicle.insurance_expiry) : 'Not set'
      ]);
      break;

    case 'drivers-report':
      tableHeaders = ['Name', 'Contact', 'License Number', 'License Type', 'Expiry Date', 'Status'];
      tableData = data.map(driver => [
        truncateText(driver.name || 'Unknown Driver', 20),
        truncateText(driver.contact || driver.phone || driver.email || 'No contact info', 18),
        truncateText(driver.license_number || 'Not provided', 15),
        truncateText(driver.license_type || 'Standard', 12),
        driver.license_expiry ? formatDateString(driver.license_expiry) : 'Not set',
        formatStatus(driver.status || 'unknown')
      ]);
      break;

    case 'fuel-report':
      tableHeaders = ['Date', 'Vehicle', 'Fuel Type', 'Volume (L)', 'Cost', 'Mileage', 'Efficiency'];
      tableData = data.map(fuelLog => {
        const volume = Number(fuelLog.volume || 0);
        const cost = Number(fuelLog.cost || 0);
        const efficiency = volume > 0 ? `${(cost / volume).toFixed(2)} $/L` : 'N/A';
        
        return [
          formatDateString(fuelLog.date),
          fuelLog.vehicles ? truncateText(`${fuelLog.vehicles.make || ''} ${fuelLog.vehicles.model || ''}`.trim(), 15) || 'Unknown' : 'Unknown',
          truncateText(fuelLog.fuel_type || 'Regular', 10),
          volume.toFixed(1),
          formatCurrency(cost),
          fuelLog.mileage ? fuelLog.mileage.toLocaleString() : 'N/A',
          efficiency
        ];
      });
      break;

    case 'maintenance-report':
      tableHeaders = ['Date', 'Vehicle', 'Service Description', 'Status', 'Cost', 'Provider'];
      tableData = data.map(maintenance => [
        formatDateString(maintenance.date),
        maintenance.vehicles ? truncateText(`${maintenance.vehicles.make || ''} ${maintenance.vehicles.model || ''}`.trim(), 15) || 'Unknown' : 'Unknown',
        truncateText(maintenance.description || 'General maintenance', 30),
        formatStatus(maintenance.status || 'scheduled'),
        formatCurrency(maintenance.cost),
        truncateText(maintenance.service_provider || 'Internal', 15)
      ]);
      break;

    case 'financial-report':
      tableHeaders = ['Period', 'Revenue', 'Fuel Costs', 'Maintenance', 'Net Profit', 'Margin'];
      tableData = data.map(financial => {
        const revenue = Number(financial.revenue || 0);
        const costs = Number(financial.costs || 0);
        const profit = revenue - costs;
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) + '%' : '0%';
        
        return [
          truncateText(financial.period || 'Unknown', 15),
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
            value !== null && value !== undefined ? truncateText(String(value), 20) : 'N/A'
          )
        );
      }
      break;
  }

  return { tableHeaders, tableData };
}
