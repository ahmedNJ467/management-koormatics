import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// Export to PDF with improved spacious layout
export const exportToPDF = (data: any[], title: string, filename: string) => {
  if (!data || data.length === 0) return;
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: 'letter'
  });
  
  // Set up document margins and spacing
  const pageMargin = 0.5;
  
  // Title and header section
  doc.setFontSize(22);
  doc.text(title, pageMargin, 1.0);
  
  doc.setFontSize(12);
  doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy')}`, pageMargin, 1.4);
  
  doc.setFontSize(18);
  doc.setTextColor(0, 51, 102);
  doc.text("FLEET MANAGEMENT DEPARTMENT", doc.internal.pageSize.width / 2, 0.6, { align: 'center' });
  
  const flattenedData = flattenData(data);
  
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

  // Create a more spacious table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 1.8,
    styles: {
      fontSize: 10,
      cellPadding: { top: 0.15, right: 0.1, bottom: 0.15, left: 0.1 },
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
      minCellHeight: 0.4
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 0.2, right: 0.1, bottom: 0.2, left: 0.1 },
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 1.8, left: pageMargin, right: pageMargin, bottom: 0.5 },
    tableWidth: 'auto',
    columnStyles: {
      1: { // Client column (index 1)
        cellWidth: 2.5, // Make Client column wider
        cellPadding: { top: 0.2, right: 0.1, bottom: 0.2, left: 0.1 },
      },
    },
    didDrawCell: (data) => {
      // Apply special formatting for client column with passengers
      if (data.section === 'body' && data.column.index === 1) {
        const content = data.cell.text.join('\n');
        if (content.includes('(Organization)')) {
          // If it's an organization with passengers, adjust formatting
          if (content.includes('Passengers:')) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            
            // Get cell dimensions
            const cell = data.cell;
            const x = cell.x + 0.1;
            let y = cell.y + 0.3;
            
            // Clear the cell and redraw text with custom formatting
            const textLines = content.split('\n');
            
            // Draw organization name with bold
            doc.setFont('helvetica', 'bold');
            doc.text(textLines[0], x, y);
            y += 0.25;
            
            // Draw organization label
            doc.setFont('helvetica', 'italic');
            doc.text(textLines[1], x, y);
            y += 0.35;
            
            // Draw passengers header
            doc.setFont('helvetica', 'bold');
            doc.text(textLines[3], x, y);
            y += 0.3;
            
            // Draw passenger names with normal font
            doc.setFont('helvetica', 'normal');
            for (let i = 4; i < textLines.length; i++) {
              doc.text(textLines[i], x + 0.15, y);
              y += 0.25;
            }
          }
        }
      }
    },
    didDrawPage: (data) => {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height;
      
      doc.setFontSize(9);
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
        pageSize.width - pageMargin,
        pageHeight - 0.3,
        { align: 'right' }
      );
    }
  });
  
  doc.save(`${filename}.pdf`);
};

// Helper function for vehicle maintenance costs
function getVehicleMaintenanceCosts(vehicle: any, data: any[]) {
  if (!vehicle.maintenance) return 0;
  
  return Array.isArray(vehicle.maintenance)
    ? vehicle.maintenance.reduce((sum, item) => sum + Number(item.cost || 0), 0)
    : 0;
}

// Export to CSV
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
