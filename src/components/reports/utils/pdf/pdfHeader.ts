
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig, pdfFonts } from "./pdfStyles";

// Draw an enhanced header section for professional PDFs
export function drawPdfHeader(doc: jsPDF, title: string): void {
  const { pageMargin } = pdfConfig;
  const pageWidth = doc.internal.pageSize.width;
  
  // Add sophisticated gradient header background
  doc.setFillColor(...pdfColors.headerBg);
  doc.rect(0, 0, pageWidth, 1.5, 'F');
  
  // Add secondary accent strip
  doc.setFillColor(...pdfColors.accent);
  doc.rect(0, 1.5, pageWidth, 0.1, 'F');
  
  try {
    // Try to add the company logo (placeholder for now)
    doc.addImage(pdfConfig.logoPath, 'PNG', pageMargin, 0.25, 1.0, 1.0);
  } catch (error) {
    // If logo fails, add a styled company initial
    doc.setFillColor(255, 255, 255);
    doc.circle(pageMargin + 0.5, 0.75, 0.4, 'F');
    doc.setFontSize(24);
    doc.setTextColor(...pdfColors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text('PBG', pageMargin + 0.3, 0.85);
  }
  
  // Add company name with enhanced styling
  doc.setFontSize(pdfFonts.titleSize);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(pdfConfig.companyName, pageWidth / 2, 0.7, { align: 'center' });
  
  // Add professional subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('FLEET MANAGEMENT SOLUTIONS', pageWidth / 2, 1.0, { align: 'center' });
  
  // Add report title with modern styling
  doc.setFontSize(pdfFonts.subtitleSize);
  doc.setTextColor(...pdfColors.dark);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), pageWidth / 2, 2.0, { align: 'center' });
  
  // Add decorative elements
  doc.setDrawColor(...pdfColors.accent);
  doc.setLineWidth(0.02);
  const lineWidth = 3;
  const startX = (pageWidth - lineWidth) / 2;
  doc.line(startX, 2.2, startX + lineWidth, 2.2);
  
  // Add generation info with professional formatting
  doc.setFontSize(10);
  doc.setTextColor(...pdfColors.text);
  doc.setFont('helvetica', 'normal');
  
  const generationDate = format(new Date(), 'EEEE, MMMM do, yyyy \'at\' h:mm a');
  doc.text(`Generated: ${generationDate}`, pageMargin, 2.6);
  
  // Add page info on the right
  doc.text('Page 1', pageWidth - pageMargin, 2.6, { align: 'right' });
  
  // Add contact information
  doc.setFontSize(8);
  doc.setTextColor(...pdfColors.secondary);
  doc.text('📞 Contact: +1 (555) 123-4567 | 📧 info@pbgmovement.com', pageWidth / 2, 2.9, { align: 'center' });
}
