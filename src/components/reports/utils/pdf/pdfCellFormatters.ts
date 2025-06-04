
import jsPDF from "jspdf";
import { pdfColors } from "./pdfStyles";

// Format client cell with passengers (for organization trips)
export function formatClientCell(doc: jsPDF, data: any, cell: any): void {
  // This function can be used for special formatting if needed
  // Currently the formatting is handled in tableFormatters.ts
}

// Format status cells with professional color coding
export function formatStatusCell(doc: jsPDF, data: any, filename: string): void {
  const cellContent = data.cell.text.join('').toLowerCase();
  
  // Apply background colors for different statuses (similar to the example)
  if (data.section === 'body') {
    // For trips report - highlight certain service types
    if (filename === 'trips-report') {
      if (data.column.index === 4) { // Service type column
        if (cellContent.includes('airport') || cellContent.includes('dropoff')) {
          // Light red background for airport services
          doc.setFillColor(...pdfColors.statusRed);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        } else if (cellContent.includes('round') || cellContent.includes('trip')) {
          // Light orange background for round trips
          doc.setFillColor(...pdfColors.statusOrange);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        }
      }
    }
    
    // Status columns for other reports
    if ((filename === 'vehicles-report' && data.column.index === 4) || 
        (filename === 'drivers-report' && data.column.index === 5) ||
        (filename === 'maintenance-report' && data.column.index === 3)) {
      
      if (cellContent.includes('active') || cellContent.includes('completed')) {
        doc.setFillColor(...pdfColors.statusGreen);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
      } else if (cellContent.includes('maintenance') || cellContent.includes('scheduled')) {
        doc.setFillColor(...pdfColors.statusOrange);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
      } else if (cellContent.includes('inactive') || cellContent.includes('cancelled')) {
        doc.setFillColor(...pdfColors.statusRed);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
      }
    }
  }
  
  // Ensure text remains black and visible
  doc.setTextColor(...pdfColors.text);
}
