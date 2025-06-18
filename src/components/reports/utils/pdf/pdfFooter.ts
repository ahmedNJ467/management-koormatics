
import jsPDF from "jspdf";
import { format } from "date-fns";
import { pdfColors, pdfConfig, pdfFonts } from "./pdfStyles";

// Enhanced professional footer with superior styling and layout
export function drawPdfFooter(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const { pageMargin } = pdfConfig;

  // Enhanced footer positioning
  const footerY = pageHeight - 0.6;
  const lineY = footerY - 0.2;

  // Professional separator line with gradient effect
  doc.setDrawColor(pdfColors.divider[0], pdfColors.divider[1], pdfColors.divider[2]);
  doc.setLineWidth(0.01);
  doc.line(pageMargin, lineY, pageWidth - pageMargin, lineY);

  // Accent line for enhanced visual appeal
  doc.setDrawColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.setLineWidth(0.005);
  doc.line(pageMargin, lineY - 0.02, pageWidth - pageMargin, lineY - 0.02);

  // Enhanced company information - left aligned
  doc.setFontSize(pdfFonts.smallSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
  doc.text(pdfConfig.companyName, pageMargin, footerY);

  // Professional tagline
  doc.setFontSize(pdfFonts.smallSize - 1);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  doc.text("Transportation & Logistics Management", pageMargin, footerY + 0.15);

  // Enhanced page numbering - center aligned
  const pageCount = doc.internal.getNumberOfPages();
  const currentPage = 1; // Default to page 1 since we can't get current page reliably

  doc.setFontSize(pdfFonts.smallSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  doc.text(`Page ${currentPage}`, pageWidth / 2, footerY, { align: "center" });

  // Professional timestamp - right aligned
  doc.setFontSize(pdfFonts.smallSize - 1);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  doc.text(
    `Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    pageWidth - pageMargin,
    footerY,
    { align: "right" }
  );

  // Contact information or website (optional)
  doc.setFontSize(pdfFonts.smallSize - 1);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  doc.text("www.koormatics.com", pageWidth - pageMargin, footerY + 0.15, {
    align: "right",
  });
}
