
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TripType, tripTypeDisplayMap } from "@/lib/types/trip";

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

export const exportToPDF = (data: any[], title: string, filename: string) => {
  if (!data || data.length === 0) return;
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: 'letter'
  });
  
  doc.setFontSize(18);
  doc.text(title, 0.5, 0.8);
  doc.setFontSize(11);
  doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy')}`, 0.5, 1.2);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text("FLEET MANAGEMENT DEPARTMENT", doc.internal.pageSize.width / 2, 0.4, { align: 'center' });
  
  const flattenedData = flattenData(data);
  
  let tableHeaders: string[] = [];
  let tableData: string[][] = [];
  
  if (filename === 'trips-report') {
    tableHeaders = [
      'Date', 
      'Client/Passenger',
      'Service Type', 
      'Pick-up Address', 
      'Drop-off Address',
      'Time',
      'Flight',
      'Assigned Driver'
    ];
    
    tableData = data.map(trip => [
      format(new Date(trip.date), 'MM/dd/yyyy'),
      trip.clients?.name || 'N/A',
      trip.display_type || 'N/A',
      trip.pickup_location || 'N/A',
      trip.dropoff_location || 'N/A',
      trip.start_time ? `${trip.start_time} - ${trip.end_time || 'N/A'}` : 'N/A',
      trip.flight_info || 'N/A',
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
      `$${getVehicleMaintenanceCosts(vehicle.id, data).toFixed(2)}`
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
    const firstItem = flattenedData[0];
    if (firstItem) {
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
  }

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 1.5,
    styles: {
      fontSize: 9,
      cellPadding: 0.1,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 1.5, left: 0.5, right: 0.5, bottom: 0.5 },
    tableWidth: 'auto',
    didDrawPage: (data) => {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height;
      
      doc.setFontSize(8);
      doc.setTextColor(100);
      
      const pageNumber = doc.getNumberOfPages();
      doc.text(
        `Page ${pageNumber}`, 
        pageSize.width / 2, 
        pageHeight - 0.3, 
        { align: 'center' }
      );
      
      doc.text(
        `Generated: ${format(new Date(), 'MM/dd/yyyy HH:mm:ss')}`,
        pageSize.width - 0.5,
        pageHeight - 0.3,
        { align: 'right' }
      );
    }
  });
  
  doc.save(`${filename}.pdf`);
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  const flattenedData = flattenData(data);
  
  const headers: string[] = Array.from(
    new Set(
      flattenedData.flatMap(obj => Object.keys(obj))
    )
  );
  
  const csvContent = [
    headers.join(','),
    ...flattenedData.map(row => 
      headers.map(header => {
        const val = row[header] !== undefined ? row[header] : '';
        const escaped = typeof val === 'string' && 
          (val.includes(',') || val.includes('"') || val.includes('\n')) 
            ? `"${val.replace(/"/g, '""')}"` 
            : val;
        return escaped;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getVehicleMaintenanceCosts = (vehicleId: string, vehiclesData: any[]) => {
  if (!vehiclesData) return 0;
  
  const vehicle = vehiclesData.find(v => v.id === vehicleId);
  if (!vehicle || !vehicle.maintenance) return 0;
  
  return Array.isArray(vehicle.maintenance)
    ? vehicle.maintenance.reduce((sum, item) => sum + Number(item.cost || 0), 0)
    : 0;
};

export const calculateTotalFuelCost = (fuelData: any[]) => {
  if (!fuelData) return 0;
  return fuelData.reduce((sum, log) => sum + Number(log.cost || 0), 0);
};

export const calculateTotalMaintenanceCost = (maintenanceData: any[]) => {
  if (!maintenanceData) return 0;
  return maintenanceData.reduce((sum, record) => sum + Number(record.cost || 0), 0);
};

export const calculateTotalTripRevenue = (tripsData: any[]) => {
  if (!tripsData) return 0;
  return tripsData.reduce((sum, trip) => sum + Number(trip.amount || 0), 0);
};

export const extractFlightInfo = (notes: string) => {
  let flightInfo = '';
  
  const flightNumberMatch = notes.match(/Flight:?\s*([A-Z0-9]{2,}\s*[0-9]{1,4}[A-Z]?)/i);
  const airlineMatch = notes.match(/Airline:?\s*([^,\n]+)/i);
  const terminalMatch = notes.match(/Terminal:?\s*([^,\n]+)/i);
  
  if (flightNumberMatch) {
    flightInfo += `${flightNumberMatch[1].trim()}`;
  }
  
  if (airlineMatch) {
    flightInfo += flightInfo ? `, ${airlineMatch[1].trim()}` : `${airlineMatch[1].trim()}`;
  }
  
  if (terminalMatch) {
    flightInfo += flightInfo ? `, ${terminalMatch[1].trim()}` : `${terminalMatch[1].trim()}`;
  }
  
  return flightInfo;
};
