import jsPDF from "jspdf";
import { pdfColors, pdfFonts } from "./pdfStyles";

// Enhanced professional cell formatting matching template design
export function formatClientCell(doc: jsPDF, data: any, cell: any): void {
  // Enhanced client cell formatting for organization trips
  if (data.section === "body" && data.column.index === 1) {
    // Add subtle background for client cells to improve readability
    doc.setFillColor(250, 250, 250);
    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
  }
}

// Enhanced status cell formatting matching template color scheme
export function formatStatusCell(
  doc: jsPDF,
  data: any,
  filename: string
): void {
  const cellContent = data.cell.text.join("").toLowerCase();

  // Apply enhanced background colors matching template design
  if (data.section === "body") {
    let shouldHighlight = false;
    let highlightColor = [255, 255, 255]; // Default white

    // Enhanced trips report formatting matching template colors
    if (filename === "trips-report") {
      if (data.column.index === 4) {
        // SERVICE TYPE column
        if (
          cellContent.includes("airport") ||
          cellContent.includes("pickup") ||
          cellContent.includes("dropoff")
        ) {
          // Light red/pink for airport services (matching template)
          highlightColor = [255, 182, 193];
          shouldHighlight = true;
        } else if (
          cellContent.includes("round") ||
          cellContent.includes("trip") ||
          cellContent.includes("tour")
        ) {
          // Light orange/beige for round trips (matching template)
          highlightColor = [255, 228, 196];
          shouldHighlight = true;
        } else if (
          cellContent.includes("charter") ||
          cellContent.includes("special")
        ) {
          // Light green for charter/special services (matching template)
          highlightColor = [144, 238, 144];
          shouldHighlight = true;
        }
      }
    }

    // Enhanced status columns for other reports
    const isStatusColumn =
      (filename === "vehicles-report" && data.column.index === 4) ||
      (filename === "drivers-report" && data.column.index === 5) ||
      (filename === "maintenance-report" && data.column.index === 3);

    if (isStatusColumn) {
      if (
        cellContent.includes("active") ||
        cellContent.includes("completed") ||
        cellContent.includes("available")
      ) {
        highlightColor = [144, 238, 144]; // Light green
        shouldHighlight = true;
      } else if (
        cellContent.includes("maintenance") ||
        cellContent.includes("scheduled") ||
        cellContent.includes("pending")
      ) {
        highlightColor = [255, 228, 196]; // Light orange
        shouldHighlight = true;
      } else if (
        cellContent.includes("inactive") ||
        cellContent.includes("cancelled") ||
        cellContent.includes("expired")
      ) {
        highlightColor = [255, 182, 193]; // Light red
        shouldHighlight = true;
      }
    }

    // Apply highlighting with template-style formatting
    if (shouldHighlight) {
      doc.setFillColor(...highlightColor);
      doc.rect(
        data.cell.x,
        data.cell.y,
        data.cell.width,
        data.cell.height,
        "F"
      );

      // Add border consistent with template
      doc.setDrawColor(128, 128, 128);
      doc.setLineWidth(0.01);
      doc.rect(
        data.cell.x,
        data.cell.y,
        data.cell.width,
        data.cell.height,
        "S"
      );
    }
  }

  // Ensure text remains black and readable (matching template)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(pdfFonts.bodySize);
}

// Enhanced date cell formatting for better consistency
export function formatDateCell(doc: jsPDF, data: any): void {
  if (data.section === "body" && data.column.index === 0) {
    // Apply consistent date formatting
    doc.setFont("helvetica", "normal");
    doc.setFontSize(pdfFonts.bodySize);
    doc.setTextColor(0, 0, 0);
  }
}

// Enhanced numeric cell formatting for financial data
export function formatNumericCell(
  doc: jsPDF,
  data: any,
  isFinancial: boolean = false
): void {
  if (data.section === "body") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(pdfFonts.bodySize);

    if (isFinancial) {
      // Enhanced styling for financial data
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setTextColor(0, 0, 0);
    }
  }
}
