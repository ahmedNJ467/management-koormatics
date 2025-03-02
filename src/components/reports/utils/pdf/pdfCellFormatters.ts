import jsPDF from "jspdf";
import { TextOptionsLight } from "jspdf";
import { pdfColors } from "./pdfStyles";

// Format client cell with passengers
export function formatClientCell(doc: jsPDF, data: any, cell: any): void {
  // Only process if we have cell data
  if (!data.cell.text || !data.cell.text.length) return;
  
  const content = data.cell.text.join('\n');
  if (content.includes('(Organization)')) {
    // If it's an organization with passengers, adjust formatting
    if (content.includes('Passengers:')) {
      doc.setFillColor(15, 23, 42); // Dark background for organization cells
      doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
      
      // Get cell dimensions
      const x = cell.x + 0.15; // Increased padding
      let y = cell.y + 0.3;
      
      // Clear the cell and redraw text with custom formatting
      const textLines = content.split('\n');
      
      // Draw organization name with bold
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text for organization name
      doc.text(textLines[0].toUpperCase(), x, y);
      y += 0.35;
      
      // Skip the "(Organization)" and "Passengers: count" lines
      
      // Find the index where actual passenger names start (after the count line)
      const passengerStartIndex = textLines.findIndex(line => line.startsWith('Passengers:')) + 1;
      
      // Draw passenger names with normal font and bullet points
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255); // White for passenger names
      doc.setFontSize(8); // Smaller font size for passengers
      
      // Draw each passenger name with bullet point
      for (let i = passengerStartIndex; i < textLines.length; i++) {
        if (textLines[i].trim()) {
          doc.text(`• ${textLines[i].trim()}`, x, y);
          y += 0.25; // Slightly increased line spacing for better readability
        }
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
  
  // For trips report - status column
  if (filename === 'trips-report' && data.column.index === 6) {
    if (cellContent.includes('completed')) {
      doc.setTextColor(39, 174, 96); // Green for completed
    } else if (cellContent.includes('scheduled')) {
      doc.setTextColor(52, 152, 219); // Blue for scheduled
    } else if (cellContent.includes('cancelled')) {
      doc.setTextColor(231, 76, 60); // Red for cancelled
    } else if (cellContent.includes('in_progress')) {
      doc.setTextColor(230, 126, 34); // Orange for in progress
    }
  }
}
