
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig, pdfFonts } from "./pdfStyles";

// Draw a professional header with company branding
export function drawPdfHeader(doc: jsPDF, title: string): void {
  const { pageMargin } = pdfConfig;
  const pageWidth = doc.internal.pageSize.width;
  
  // Header background with gradient effect
  doc.setFillColor(...pdfColors.headerBg);
  doc.rect(0, 0, pageWidth, 1.2, 'F');
  
  // Company logo and info section
  const logoWidth = 1.8;
  const logoHeight = logoWidth * pdfConfig.logoAspectRatio;
  const logoX = pageMargin;
  const logoY = 0.2;

  if (pdfConfig.logoPath) {
    try {
      doc.addImage(pdfConfig.logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
      // Fallback to text if logo fails to load
      doc.setFontSize(pdfFonts.titleSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pdfColors.headerText);
      doc.text(pdfConfig.companyName, logoX, logoY + 0.3);
    }
  } else {
    // Fallback to text if no logo path is defined
    doc.setFontSize(pdfFonts.titleSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...pdfColors.headerText);
    doc.text(pdfConfig.companyName, logoX, logoY + 0.3);
  }

  // Report title section
  doc.setFontSize(pdfFonts.titleSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...pdfColors.headerText);
  doc.text(title.toUpperCase(), pageWidth - pageMargin, logoY + 0.2, { align: 'right' });
  
  // Report generation info
  doc.setFontSize(pdfFonts.bodySize);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated: ${format(new Date(), 'MMMM dd, yyyy')}`,
    pageWidth - pageMargin,
    logoY + 0.5,
    { align: 'right' }
  );
  
  // Subtitle line
  const subtitleY = logoY + logoHeight + 0.1;
  doc.setFontSize(pdfFonts.subtitleSize);
  doc.setFont('helvetica', 'normal');
  doc.text('Fleet Management System Report', pageWidth / 2, subtitleY, { align: 'center' });
  
  // Professional separator line
  const lineY = subtitleY + 0.2;
  doc.setDrawColor(...pdfColors.primary);
  doc.setLineWidth(0.02);
  doc.line(pageMargin, lineY, pageWidth - pageMargin, lineY);
  
  // Reset text color for content
  doc.setTextColor(...pdfColors.text);
}
