
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig, pdfFonts } from "./pdfStyles";

// Draw the header section of the PDF
export function drawPdfHeader(doc: jsPDF, title: string): void {
  const { pageMargin } = pdfConfig;
  
  // Add a gradient header background
  doc.setFillColor(...pdfColors.headerBg);
  doc.rect(0, 0, doc.internal.pageSize.width, 1.2, 'F');
  
  // Add logo
  doc.addImage(pdfConfig.logoPath, 'PNG', pageMargin, 0.3, 0.8, 0.8);
  
  // Add company name styled
  doc.setFontSize(pdfFonts.titleSize);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(pdfConfig.companyName, doc.internal.pageSize.width / 2, 0.6, { align: 'center' });
  
  // Add report title
  doc.setFontSize(pdfFonts.subtitleSize);
  doc.setTextColor(255, 255, 255);
  doc.text(title, doc.internal.pageSize.width / 2, 0.9, { align: 'center' });
  
  // Add decorative element - line
  doc.setDrawColor(...pdfColors.accent);
  doc.setLineWidth(0.03);
  const lineWidth = 4;
  const startX = (doc.internal.pageSize.width - lineWidth) / 2;
  doc.line(startX, 1.1, startX + lineWidth, 1.1);
  
  // Add date with modern style
  doc.setFontSize(11);
  doc.setTextColor(...pdfColors.dark);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, pageMargin, 1.6);
}
