
import { format } from "date-fns";
import { getVehicleMaintenanceCosts, formatClientWithPassengers } from "../dataUtils";

// Generate table headers and data based on report type
export function generateTableData(data: any[], filename: string) {
  let tableHeaders: string[] = [];
  let tableData: string[][] = [];
  
  if (filename === 'trips-report') {
    tableHeaders = [
      'Date', 
      'Client',
      'Service Type', 
      'Pick-up Address', 
      'Drop-off Address',
      'Time',
      'Flight',
      'Vehicle', 
      'Assigned Driver'
    ];
    
    tableData = data.map(trip => [
      format(new Date(trip.date), 'MM/dd/yyyy'),
      formatClientWithPassengers(trip),
      trip.display_type || 'N/A',
      trip.pickup_location || 'N/A',
      trip.dropoff_location || 'N/A',
      trip.time ? `${trip.time} - ${trip.return_time || 'N/A'}` : 'N/A',
      trip.flight_number ? `${trip.airline || ''} ${trip.flight_number || ''} ${trip.terminal ? `(${trip.terminal})` : ''}`.trim() : 'N/A',
      `${trip.vehicles?.make || ''} ${trip.vehicles?.model || ''}`.trim() || 'N/A',
      trip.drivers?.name || 'N/A'
    ]);
  } else if (filename === 'vehicles-report') {
    tableHeaders = ['Make', 'Model', 'Year', 'Type', 'Registration', 'Status', 'Insurance Expiry', 'Maintenance Cost'];
    tableData = data.map(vehicle => [
      vehicle.make || 'N/A',
      vehicle.model || 'N/A',
      vehicle.year?.toString() || 'N/A',
      vehicle.type || 'N/A',
      vehicle.registration || 'N/A',
      vehicle.status || 'N/A',
      vehicle.insurance_expiry ? format(new Date(vehicle.insurance_expiry), 'MM/dd/yyyy') : 'N/A',
      `$${getVehicleMaintenanceCosts(vehicle, data).toFixed(2)}`
    ]);
  } else if (filename === 'fuel-report') {
    tableHeaders = ['Date', 'Vehicle', 'Volume (L)', 'Type', 'Mileage (km)', 'Cost ($)', 'Notes'];
    tableData = data.map(log => [
      format(new Date(log.date), 'MM/dd/yyyy'),
      `${log.vehicles?.make || ''} ${log.vehicles?.model || ''}`.trim() || 'N/A',
      log.volume?.toString() || 'N/A',
      log.fuel_type || 'N/A',
      log.mileage?.toString() || 'N/A',
      `$${Number(log.cost).toFixed(2)}`,
      log.notes || 'N/A'
    ]);
  } else if (filename === 'maintenance-report') {
    tableHeaders = ['Date', 'Vehicle', 'Description', 'Status', 'Service Provider', 'Cost ($)', 'Next Scheduled'];
    tableData = data.map(record => [
      format(new Date(record.date), 'MM/dd/yyyy'),
      `${record.vehicles?.make || ''} ${record.vehicles?.model || ''}`.trim() || 'N/A',
      record.description || 'N/A',
      record.status || 'N/A',
      record.service_provider || 'N/A',
      `$${Number(record.cost).toFixed(2)}`,
      record.next_scheduled ? format(new Date(record.next_scheduled), 'MM/dd/yyyy') : 'N/A'
    ]);
  } else if (filename === 'drivers-report') {
    tableHeaders = ['Name', 'Contact', 'License Type', 'License No.', 'Expiry', 'Status'];
    tableData = data.map(driver => [
      driver.name || 'N/A',
      driver.contact || 'N/A',
      driver.license_type || 'N/A',
      driver.license_number || 'N/A',
      driver.license_expiry ? format(new Date(driver.license_expiry), 'MM/dd/yyyy') : 'N/A',
      driver.status || 'N/A'
    ]);
  } else {
    const flattenedData = data.map(item => {
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
    
    const firstItem = flattenedData[0];
    const headers = Object.keys(firstItem);
    tableHeaders = headers.map(h => h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' '));
    
    tableData = flattenedData.map(item => 
      headers.map(header => {
        const val = item[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      })
    );
  }
  
  return { tableHeaders, tableData };
}
