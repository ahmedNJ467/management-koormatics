
import { format } from "date-fns";

// Generate professional table data with enhanced formatting
export function generateTableData(data: any[], reportType: string) {
  let tableHeaders: string[] = [];
  let tableData: any[] = [];

  // Enhanced date formatting
  const formatDateString = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return format(dateObj, 'dd/MM/yyyy');
    } catch (error) {
      return dateStr || '';
    }
  };

  // Enhanced time formatting
  const formatTimeString = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      // Handle both time-only strings and full datetime strings
      if (timeStr.includes('T') || timeStr.includes(' ')) {
        const dateObj = new Date(timeStr);
        return format(dateObj, 'HH:mm');
      } else {
        // Handle time-only format like "14:30:00"
        return timeStr.substring(0, 5); // Extract HH:MM
      }
    } catch (error) {
      return timeStr;
    }
  };

  // Professional text formatting
  const formatText = (text: string, maxLength?: number) => {
    if (!text) return '';
    const cleaned = text.trim();
    return maxLength ? cleaned.substring(0, maxLength) : cleaned;
  };

  // Currency formatting
  const formatCurrency = (amount: number | string) => {
    const num = Number(amount) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  switch (reportType) {
    case 'trips-report':
      tableHeaders = [
        'Date', 'Client/Passenger(s)', 'Organization', 'Contact', 
        'Service Type', 'Pickup Location', 'Dropoff Location', 
        'Time', 'Flight Details', 'Vehicle', 'Driver'
      ];
      
      tableData = data.map(trip => {
        // Enhanced client and passenger handling
        const clientName = trip.clients?.name || '';
        const isOrganization = trip.clients?.type === 'organization';
        
        let passengerDisplay = '';
        if (isOrganization && trip.passengers && trip.passengers.length > 0) {
          passengerDisplay = trip.passengers.slice(0, 2).join(', ');
          if (trip.passengers.length > 2) {
            passengerDisplay += ` +${trip.passengers.length - 2} more`;
          }
        } else if (clientName) {
          passengerDisplay = clientName;
        }
        
        // Enhanced vehicle display
        const vehicleInfo = trip.vehicles ? 
          `${trip.vehicles.make || ''} ${trip.vehicles.model || ''}`.trim() : '';
        
        // Enhanced flight details
        const flightDetails = trip.flight_number ? 
          `${trip.airline || ''} ${trip.flight_number}`.trim() : '';
        
        return [
          formatDateString(trip.date),
          formatText(passengerDisplay, 30),
          isOrganization ? formatText(clientName, 20) : '',
          formatText(trip.clients?.phone || trip.clients?.email || '', 15),
          formatText(trip.service_type || 'Standard', 15),
          formatText(trip.pickup_location || '', 25),
          formatText(trip.dropoff_location || '', 25),
          formatTimeString(trip.time || ''),
          formatText(flightDetails, 15),
          formatText(vehicleInfo, 20),
          formatText(trip.drivers?.name || '', 18)
        ];
      });
      break;
      
    case 'vehicles-report':
      tableHeaders = ['Vehicle', 'Registration', 'Type', 'Year', 'Status', 'Insurance Expiry'];
      tableData = data.map(vehicle => [
        formatText(`${vehicle.make || ''} ${vehicle.model || ''}`.trim(), 30),
        formatText(vehicle.registration || '', 15),
        formatText(vehicle.type || '', 12),
        vehicle.year ? vehicle.year.toString() : '',
        formatText(vehicle.status || '', 12),
        vehicle.insurance_expiry ? formatDateString(vehicle.insurance_expiry) : 'Not Set'
      ]);
      break;

    case 'drivers-report':
      tableHeaders = ['Driver Name', 'Contact Information', 'License Number', 'License Type', 'Expiry Date', 'Status'];
      tableData = data.map(driver => [
        formatText(driver.name || '', 25),
        formatText(driver.contact || driver.phone || driver.email || '', 20),
        formatText(driver.license_number || '', 15),
        formatText(driver.license_type || '', 12),
        driver.license_expiry ? formatDateString(driver.license_expiry) : 'Not Set',
        formatText(driver.status || '', 12)
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
          fuelLog.vehicles ? formatText(`${fuelLog.vehicles.make || ''} ${fuelLog.vehicles.model || ''}`.trim(), 25) : '',
          formatText(fuelLog.fuel_type || 'Regular', 10),
          volume.toFixed(1),
          formatCurrency(cost),
          fuelLog.mileage ? fuelLog.mileage.toLocaleString() : '',
          efficiency
        ];
      });
      break;

    case 'maintenance-report':
      tableHeaders = ['Date', 'Vehicle', 'Service Description', 'Status', 'Cost', 'Service Provider'];
      tableData = data.map(maintenance => [
        formatDateString(maintenance.date),
        maintenance.vehicles ? formatText(`${maintenance.vehicles.make || ''} ${maintenance.vehicles.model || ''}`.trim(), 25) : '',
        formatText(maintenance.description || '', 40),
        formatText(maintenance.status || '', 12),
        formatCurrency(maintenance.cost || 0),
        formatText(maintenance.service_provider || 'Internal', 18)
      ]);
      break;

    default:
      // Enhanced generic handling
      if (data.length > 0) {
        const firstItem = data[0];
        tableHeaders = Object.keys(firstItem).map(key => 
          formatText(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
        );
        tableData = data.map(item => 
          Object.values(item).map(value => 
            value !== null && value !== undefined ? formatText(String(value), 30) : ''
          )
        );
      }
      break;
  }

  return { tableHeaders, tableData };
}
