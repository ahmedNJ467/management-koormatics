
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig, pdfFonts } from "./pdfStyles";

// Enhanced professional header matching the template design
export function drawPdfHeader(doc: jsPDF, title: string): void {
  const { pageMargin } = pdfConfig;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Professional black header background matching template
  doc.setFillColor(0, 0, 0); // Black background
  doc.rect(0, 0, pageWidth, 1.2, "F");

  // Company logo section - left aligned
  const logoWidth = 1.8;
  const logoHeight = logoWidth * pdfConfig.logoAspectRatio;
  const logoX = pageMargin;
  const logoY = 0.2;

  // Add Koormatics logo
  if (pdfConfig.logoPath) {
    try {
      doc.addImage(
        pdfConfig.logoPath,
        "SVG",
        logoX,
        logoY,
        logoWidth,
        logoHeight
      );
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
      // Fallback to text
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("KOORMATICS", logoX, logoY + 0.4);
    }
  }

  // Main header text - center aligned matching template style
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);

  // Create the header text similar to "PBG | MOVCON DEPT."
  const headerText = "KOORMATICS | MOVCON DEPT.";
  const textWidth = doc.getTextWidth(headerText);
  const centerX = pageWidth / 2;
  doc.text(headerText, centerX - textWidth / 2, 0.7);

  // Company subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TRANSPORTATION & LOGISTICS", centerX, 0.95, { align: "center" });

  // Reset text color for content
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
}
