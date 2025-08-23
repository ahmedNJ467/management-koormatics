
import { flattenData } from "./dataUtils";

// Enhanced CSV export with better formatting and structure
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn('No data available for CSV export');
    return;
  }
  
  // Process data based on report type for better structure
  let processedData = [...data];
  
  // Special handling for trips report to flatten passenger data
  if (filename === 'trips-report') {
    processedData = data.map(trip => ({
      ...trip,
      client_name: trip.clients?.name || 'Unknown',
      client_type: trip.clients?.type || 'individual',
      passenger_count: trip.passengers?.length || 0,
      passenger_names: trip.passengers?.join('; ') || '',
      vehicle_info: trip.vehicles ? `${trip.vehicles.make || ''} ${trip.vehicles.model || ''}`.trim() : 'Unassigned',
      driver_name: trip.drivers?.name || 'Not assigned',
      service_display: trip.display_type || trip.service_type || 'Standard'
    }));
  }
  
  // Flatten complex objects
  const flattenedData = flattenData(processedData);
  
  if (flattenedData.length === 0) {
    console.warn('No data to export after processing');
    return;
  }
  
  // Get all unique headers and sort them logically
  const allHeaders = Array.from(
    new Set(flattenedData.flatMap(obj => Object.keys(obj)))
  );
  
  // Define preferred header order for different report types
  const getOrderedHeaders = (headers: string[], reportType: string) => {
    const orderMaps: { [key: string]: string[] } = {
      'trips-report': [
        'date', 'client_name', 'client_type', 'service_display', 
        'pickup_location', 'dropoff_location', 'vehicle_info', 
        'driver_name', 'status', 'passenger_count', 'passenger_names', 'amount'
      ],
      'vehicles-report': [
        'make', 'model', 'year', 'registration', 'type', 'status', 
        'color', 'vin', 'insurance_expiry', 'notes'
      ],
      'drivers-report': [
        'name', 'contact', 'email', 'phone', 'license_number', 
        'license_type', 'license_expiry', 'status'
      ],
      'fuel-report': [
        'date', 'vehicle_info', 'fuel_type', 'volume', 'cost', 
        'mileage', 'previous_mileage', 'current_mileage', 'notes'
      ],
      'maintenance-report': [
        'date', 'vehicle_info', 'description', 'status', 'cost', 
        'service_provider', 'next_scheduled', 'notes'
      ]
    };
    
    const preferredOrder = orderMaps[reportType] || [];
    const orderedHeaders = [...preferredOrder.filter(h => headers.includes(h))];
    const remainingHeaders = headers.filter(h => !preferredOrder.includes(h)).sort();
    
    return [...orderedHeaders, ...remainingHeaders];
  };
  
  const orderedHeaders = getOrderedHeaders(allHeaders, filename);
  
  // Format headers to be more readable
  const formatHeader = (header: string) => {
    return header
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const formattedHeaders = orderedHeaders.map(formatHeader);
  
  // Create CSV content with proper escaping
  const csvContent = [
    // Add a title row
    [`"${filename.replace('-', ' ').toUpperCase()} - Generated on ${new Date().toLocaleDateString()}"`],
    [], // Empty row for spacing
    // Headers
    formattedHeaders.map(header => `"${header}"`),
    // Data rows
    ...flattenedData.map(row => 
      orderedHeaders.map(header => {
        const value = row[header];
        
        // Handle different data types appropriately
        if (value === null || value === undefined) {
          return '""';
        }
        
        // Format dates
        if (header.includes('date') || header.includes('expiry')) {
          try {
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime())) {
              return `"${dateValue.toLocaleDateString()}"`;
            }
          } catch {
            // If date parsing fails, use original value
          }
        }
        
        // Format currency
        if (header.includes('cost') || header.includes('amount')) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            return `"$${numValue.toFixed(2)}"`;
          }
        }
        
        // Escape and format string values
        const stringValue = String(value);
        const escaped = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : `"${stringValue}"`;
        
        return escaped;
      })
    )
  ].map(row => row.join(',')).join('\n');
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};
