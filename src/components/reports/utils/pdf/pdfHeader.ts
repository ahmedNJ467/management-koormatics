
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig, pdfFonts } from "./pdfStyles";

// Draw a professional header with company branding and improved logo visibility
export function drawPdfHeader(doc: jsPDF, title: string): void {
  const { pageMargin } = pdfConfig;
  const pageWidth = doc.internal.pageSize.width;
  
  // Header background with professional gradient effect
  doc.setFillColor(...pdfColors.headerBg);
  doc.rect(0, 0, pageWidth, 1.4, 'F');
  
  // Company logo section with white background for better visibility
  const logoWidth = 2.0;
  const logoHeight = logoWidth * pdfConfig.logoAspectRatio;
  const logoX = pageMargin;
  const logoY = 0.25;

  // Create white background circle for logo
  doc.setFillColor(...pdfColors.logoBackground);
  doc.circle(logoX + logoWidth/2, logoY + logoHeight/2, logoHeight/2 + 0.1, 'F');

  if (pdfConfig.logoPath) {
    try {
      doc.addImage(pdfConfig.logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
      // Fallback to text if logo fails to load
      doc.setFontSize(pdfFonts.titleSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pdfColors.headerText);
      doc.text(pdfConfig.companyName, logoX, logoY + 0.4);
    }
  } else {
    // Fallback to text if no logo path is defined
    doc.setFontSize(pdfFonts.titleSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...pdfColors.headerText);
    doc.text(pdfConfig.companyName, logoX, logoY + 0.4);
  }

  // Report title section - right aligned
  doc.setFontSize(pdfFonts.titleSize + 2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...pdfColors.headerText);
  doc.text(title.toUpperCase(), pageWidth - pageMargin, logoY + 0.2, { align: 'right' });
  
  // Report generation info
  doc.setFontSize(pdfFonts.bodySize);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`,
    pageWidth - pageMargin,
    logoY + 0.5,
    { align: 'right' }
  );
  
  // Subtitle line - centered
  const subtitleY = logoY + logoHeight + 0.15;
  doc.setFontSize(pdfFonts.subtitleSize);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...pdfColors.headerText);
  doc.text('Professional Fleet Management System Report', pageWidth / 2, subtitleY, { align: 'center' });
  
  // Professional separator line with enhanced styling
  const lineY = subtitleY + 0.25;
  doc.setDrawColor(...pdfColors.primary);
  doc.setLineWidth(0.03);
  doc.line(pageMargin, lineY, pageWidth - pageMargin, lineY);
  
  // Add a thin accent line below
  doc.setDrawColor(...pdfColors.headerText);
  doc.setLineWidth(0.01);
  doc.line(pageMargin, lineY + 0.05, pageWidth - pageMargin, lineY + 0.05);
  
  // Reset text color for content
  doc.setTextColor(...pdfColors.text);
}
