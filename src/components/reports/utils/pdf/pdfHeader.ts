
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig, pdfFonts } from "./pdfStyles";

// Draw a professional header matching the example
export function drawPdfHeader(doc: jsPDF, title: string): void {
  const { pageMargin } = pdfConfig;
  const pageWidth = doc.internal.pageSize.width;
  
  // Black header bar
  doc.setFillColor(...pdfColors.headerBg);
  doc.rect(0, 0, pageWidth, 0.4, 'F');
  
  // Company name in header - white text on black background
  doc.setFontSize(pdfFonts.titleSize);
  doc.setTextColor(...pdfColors.headerText);
  doc.setFont('helvetica', 'bold');
  doc.text(pdfConfig.companyName, pageWidth / 2, 0.25, { align: 'center' });
  
  // Add thin border line under header
  doc.setDrawColor(...pdfColors.border);
  doc.setLineWidth(0.01);
  doc.line(0, 0.4, pageWidth, 0.4);
  
  // Column headers section
  const startY = 0.6;
  const colHeaders = ['DATE', 'CLIENT/PASSENGER(S)', 'ORGANISATION', 'CONTACT', 'SERVICE TYPE', 'PICK-UP ADDRESS', 'DROP-OFF ADDRESS', 'TIME', 'CARRIER/FLIGHT #', 'ASSIGNED VEHICLE', 'ASSIGNED DRIVER'];
  const colWidths = [0.8, 1.4, 1.0, 0.8, 0.9, 1.3, 1.3, 0.6, 1.0, 1.2, 1.2];
  
  let currentX = pageMargin;
  
  // Draw column headers with black background
  doc.setFillColor(...pdfColors.headerBg);
  doc.rect(pageMargin, startY, pageWidth - (pageMargin * 2), 0.3, 'F');
  
  // Add column header text
  doc.setFontSize(pdfFonts.bodySize);
  doc.setTextColor(...pdfColors.headerText);
  doc.setFont('helvetica', 'bold');
  
  colHeaders.forEach((header, index) => {
    const colWidth = colWidths[index];
    doc.text(header, currentX + (colWidth / 2), startY + 0.2, { align: 'center' });
    
    // Draw vertical lines between columns
    if (index < colHeaders.length - 1) {
      doc.setDrawColor(...pdfColors.border);
      doc.setLineWidth(0.01);
      doc.line(currentX + colWidth, startY, currentX + colWidth, startY + 0.3);
    }
    
    currentX += colWidth;
  });
  
  // Draw borders around header
  doc.setDrawColor(...pdfColors.border);
  doc.setLineWidth(0.01);
  doc.rect(pageMargin, startY, pageWidth - (pageMargin * 2), 0.3);
}
