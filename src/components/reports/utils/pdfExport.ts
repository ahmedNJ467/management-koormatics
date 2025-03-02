
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { flattenData, formatClientWithPassengers, getVehicleMaintenanceCosts } from "./dataUtils";

// Define Color as tuple type [number, number, number] for RGB values
type Color = [number, number, number];

// Export to PDF with modern UI and color scheme
export const exportToPDF = (data: any[], title: string, filename: string) => {
  if (!data || data.length === 0) return;
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [11, 8.5] // Wider PDF (11 inches width, 8.5 inches height)
  });
  
  // Modern color scheme with proper tuple types
  const colors = {
    primary: [41, 128, 185] as Color,     // #2980b9 - Bright blue
    secondary: [142, 68, 173] as Color,   // #8e44ad - Purple
    accent: [39, 174, 96] as Color,       // #27ae60 - Green
    light: [236, 240, 241] as Color,      // #ecf0f1 - Light gray
    dark: [52, 73, 94] as Color,          // #34495e - Dark blue-gray
    text: [44, 62, 80] as Color,          // #2c3e50 - Almost black
    headerBg: [52, 152, 219] as Color,    // #3498db - Light blue
    rowAlt: [245, 246, 250] as Color      // #f5f6fa - Very light blue-gray
  };
  
  // Set up document margins and spacing
  const pageMargin = 0.5;
  
  // Add a gradient header background
  doc.setFillColor(...colors.headerBg);
  doc.rect(0, 0, doc.internal.pageSize.width, 1.2, 'F');
  
  // Add logo
  const logoPath = 'lovable-uploads/3900a10d-0eb8-4894-a90e-73841e2422de.png';
  doc.addImage(logoPath, 'PNG', pageMargin, 0.3, 0.8, 0.8);
  
  // Add company name styled
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("PBG MOVEMENT & SAFETY DEPT.", doc.internal.pageSize.width / 2, 0.6, { align: 'center' });
  
  // Add report title
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(title, doc.internal.pageSize.width / 2, 0.9, { align: 'center' });
  
  // Add decorative element - line
  doc.setDrawColor(...colors.accent);
  doc.setLineWidth(0.03);
  const lineWidth = 4;
  const startX = (doc.internal.pageSize.width - lineWidth) / 2;
  doc.line(startX, 1.1, startX + lineWidth, 1.1);
  
  // Add date with modern style
  doc.setFontSize(11);
  doc.setTextColor(...colors.dark);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, pageMargin, 1.6);
  
  const { tableHeaders, tableData } = generateTableData(data, filename);

  // Create a modern styled table with no grid
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 2.0,
    styles: {
      fontSize: 10,
      cellPadding: { top: 0.18, right: 0.15, bottom: 0.18, left: 0.15 },
      lineWidth: 0, // Remove grid lines
      textColor: colors.text,
      minCellHeight: 0.4,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 0.2, right: 0.15, bottom: 0.2, left: 0.15 },
    },
    alternateRowStyles: {
      fillColor: colors.rowAlt,
    },
    margin: { top: 2.0, left: pageMargin, right: pageMargin, bottom: 0.8 },
    tableWidth: 'auto',
    columnStyles: {
      1: { // Client column (index 1)
        cellWidth: 2.5, // Make Client column wider
        cellPadding: { top: 0.2, right: 0.15, bottom: 0.2, left: 0.15 },
      },
      // Add color coding for status column based on report type
      ...(filename === 'vehicles-report' ? {
        5: { // Status column for vehicles-report
          fontStyle: 'bold',
        }
      } : {}),
      ...(filename === 'maintenance-report' ? {
        3: { // Status column for maintenance-report
          fontStyle: 'bold',
        }
      } : {}),
      ...(filename === 'trips-report' ? {
        2: { // Service type column styling
          fillColor: colors.light
        }
      } : {})
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
            const x = cell.x + 0.15; // Increased padding
            let y = cell.y + 0.3;
            
            // Clear the cell and redraw text with custom formatting
            const textLines = content.split('\n');
            
            // Draw organization name with bold
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(41, 128, 185); // Use primary blue for org name
            doc.text(textLines[0], x, y);
            y += 0.25;
            
            // Draw organization label
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(142, 68, 173); // Use secondary purple for label
            doc.text(textLines[1], x, y);
            y += 0.35;
            
            // Draw passengers header
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(39, 174, 96); // Use accent green for header
            doc.text(textLines[3], x, y);
            y += 0.3;
            
            // Draw passenger names with normal font
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.text); // Back to normal text color
            for (let i = 4; i < textLines.length; i++) {
              doc.text(textLines[i], x + 0.15, y);
              y += 0.25;
            }
          }
        }
      }
      
      // Color code status values based on their values
      if (data.section === 'body') {
        const cellContent = data.cell.text.join('').toLowerCase();
        
        // For vehicles and drivers reports - status column
        if ((filename === 'vehicles-report' && data.column.index === 5) || 
            (filename === 'drivers-report' && data.column.index === 5)) {
          // Color code based on status
          if (cellContent.includes('active')) {
            doc.setTextColor(39, 174, 96); // Green for active
          } else if (cellContent.includes('maintenance') || cellContent.includes('repair')) {
            doc.setTextColor(230, 126, 34); // Orange for maintenance/repair
          } else if (cellContent.includes('inactive') || cellContent.includes('out of service')) {
            doc.setTextColor(231, 76, 60); // Red for inactive/out of service
          }
        }
        
        // For maintenance report - status column
        if (filename === 'maintenance-report' && data.column.index === 3) {
          if (cellContent.includes('completed')) {
            doc.setTextColor(39, 174, 96); // Green for completed
          } else if (cellContent.includes('scheduled')) {
            doc.setTextColor(52, 152, 219); // Blue for scheduled
          } else if (cellContent.includes('in progress')) {
            doc.setTextColor(230, 126, 34); // Orange for in progress
          } else if (cellContent.includes('pending')) {
            doc.setTextColor(155, 89, 182); // Purple for pending
          }
        }
      }
    },
    didDrawPage: (data) => {
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height;
      
      // Add footer with subtle background
      doc.setFillColor(...colors.light);
      doc.rect(0, pageHeight - 0.6, pageSize.width, 0.6, 'F');
      
      // Add page number in footer
      doc.setFontSize(9);
      doc.setTextColor(...colors.dark);
      
      const pageNumber = doc.getNumberOfPages();
      doc.text(
        `Page ${pageNumber}`, 
        pageSize.width / 2, 
        pageHeight - 0.3, 
        { align: 'center' }
      );
      
      // Add timestamp
      doc.text(
        `Generated: ${format(new Date(), 'MM/dd/yyyy HH:mm:ss')}`,
        pageSize.width - pageMargin,
        pageHeight - 0.3,
        { align: 'right' }
      );
      
      // Add company info
      doc.setTextColor(...colors.primary);
      doc.text(
        'PBG MOVEMENT & SAFETY DEPT.',
        pageMargin,
        pageHeight - 0.3,
        { align: 'left' }
      );
    }
  });
  
  doc.save(`${filename}.pdf`);
};

// Generate table headers and data based on report type
function generateTableData(data: any[], filename: string) {
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
    const flattenedData = flattenData(data);
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
