
import jsPDF from "jspdf";
import { TextOptionsLight } from "jspdf";
import { pdfColors } from "./pdfStyles";

// Format client cell with passengers
export function formatClientCell(doc: jsPDF, data: any, cell: any): void {
  const content = data.cell.text.join('\n');
  if (content.includes('(Organization)')) {
    // If it's an organization with passengers, adjust formatting
    if (content.includes('Passengers:')) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      // Get cell dimensions
      const x = cell.x + 0.15; // Increased padding
      let y = cell.y + 0.3;
      
      // Clear the cell and redraw text with custom formatting
      const textLines = content.split('\n');
      
      // Draw organization name with bold
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185); // Use primary blue for org name
      doc.text(textLines[0].toUpperCase(), x, y);
      y += 0.25;
      
      // Draw organization label
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(142, 68, 173); // Use secondary purple for label
      doc.text("Organization", x, y);
      y += 0.35;
      
      // Draw passengers icon and count instead of "Passengers:" header
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(39, 174, 96); // Use accent green for passenger count
      const passengerCount = textLines.length - 4; // Calculate actual passenger count
      doc.text(`👤 ${passengerCount} passengers`, x, y);
      y += 0.3;
      
      // Draw passenger names with normal font and bullet points
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...pdfColors.text); // Back to normal text color
      for (let i = 4; i < textLines.length; i++) {
        doc.text(`- ${textLines[i].trim()}`, x, y);
        y += 0.25;
      }
    }
  }
}

// Format status cells with color coding
export function formatStatusCell(doc: jsPDF, data: any, filename: string): void {
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
