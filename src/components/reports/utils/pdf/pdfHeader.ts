
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig, pdfFonts } from "./pdfStyles";

// Draw a professional header matching the example
export function drawPdfHeader(doc: jsPDF, title: string): void {
  const { pageMargin } = pdfConfig;
  const pageWidth = doc.internal.pageSize.width;
  
  // Add logo to header
  const logoWidth = 1.5; // inches
  const logoHeight = logoWidth * pdfConfig.logoAspectRatio; // Maintain aspect ratio
  const logoX = (pageWidth / 2) - (logoWidth / 2); // Centered
  const logoY = 0.1;

  if (pdfConfig.logoPath) {
    try {
      doc.addImage(pdfConfig.logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
      // Fallback to text if logo fails to load
      doc.setFontSize(pdfFonts.titleSize);
      doc.setFont('helvetica', 'bold');
      doc.text(pdfConfig.companyName, pageWidth / 2, 0.25, { align: 'center' });
    }
  } else {
    // Fallback to text if no logo path is defined
    doc.setFontSize(pdfFonts.titleSize);
    doc.setFont('helvetica', 'bold');
    doc.text(pdfConfig.companyName, pageWidth / 2, 0.25, { align: 'center' });
  }

  // Add thin border line under header
  const lineY = logoY + logoHeight + 0.1;
  doc.setDrawColor(...pdfColors.border);
  doc.setLineWidth(0.01);
  doc.line(pageMargin, lineY, pageWidth - pageMargin, lineY);
  
  // Column headers section
  const startY = lineY + 0.2;
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
