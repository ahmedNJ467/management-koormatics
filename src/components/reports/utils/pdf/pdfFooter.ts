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
  doc.setDrawColor(...pdfColors.divider);
  doc.setLineWidth(0.01);
  doc.line(pageMargin, lineY, pageWidth - pageMargin, lineY);

  // Accent line for enhanced visual appeal
  doc.setDrawColor(...pdfColors.primary);
  doc.setLineWidth(0.005);
  doc.line(pageMargin, lineY - 0.02, pageWidth - pageMargin, lineY - 0.02);

  // Enhanced company information - left aligned
  doc.setFontSize(pdfFonts.smallSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...pdfColors.primary);
  doc.text(pdfConfig.companyName, pageMargin, footerY);

  // Professional tagline
  doc.setFontSize(pdfFonts.smallSize - 1);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...pdfColors.text);
  doc.text("Transportation & Logistics Management", pageMargin, footerY + 0.15);

  // Enhanced page numbering - center aligned
  const pageInfo = doc.getCurrentPageInfo();
  const totalPages = pageInfo.pageNumber;

  doc.setFontSize(pdfFonts.smallSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...pdfColors.text);
  doc.text(`Page ${totalPages}`, pageWidth / 2, footerY, { align: "center" });

  // Professional timestamp - right aligned
  doc.setFontSize(pdfFonts.smallSize - 1);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...pdfColors.text);
  doc.text(
    `Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    pageWidth - pageMargin,
    footerY,
    { align: "right" }
  );

  // Contact information or website (optional)
  doc.setFontSize(pdfFonts.smallSize - 1);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...pdfColors.text);
  doc.text("www.koormatics.com", pageWidth - pageMargin, footerY + 0.15, {
    align: "right",
  });
}
