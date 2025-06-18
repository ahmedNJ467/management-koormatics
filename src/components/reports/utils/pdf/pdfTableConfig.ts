import { UserOptions } from "jspdf-autotable";
import { pdfColors, pdfFonts, pdfSpacing } from "./pdfStyles";
import { formatStatusCell } from "./pdfCellFormatters";
import { drawPdfFooter } from "./pdfFooter";

// Enhanced professional table configuration matching template design
export function getTableConfig(
  data: any[],
  filename: string,
  startY: number
): UserOptions {
  return {
    startY: startY,
    styles: {
      fontSize: pdfFonts.bodySize,
      cellPadding: { top: 0.08, right: 0.06, bottom: 0.08, left: 0.06 }, // Tighter padding like template
      lineWidth: 0.01,
      lineColor: [128, 128, 128], // Gray borders like template
      textColor: [0, 0, 0], // Black text like template
      minCellHeight: 0.35,
      font: pdfFonts.bodyFont,
      valign: "middle",
      overflow: "linebreak",
      cellWidth: "wrap",
      halign: "center", // Default center alignment like template
    },
    headStyles: {
      fillColor: [128, 128, 128], // Gray header background like template
      textColor: [255, 255, 255], // White text on gray background
      fontStyle: "bold",
      font: pdfFonts.headerFont,
      halign: "center",
      cellPadding: { top: 0.1, right: 0.06, bottom: 0.1, left: 0.06 },
      fontSize: pdfFonts.bodySize, // Same size as body for consistency
      minCellHeight: 0.4,
      lineWidth: 0.01,
      lineColor: [128, 128, 128],
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Very light gray alternating rows
      lineColor: [128, 128, 128],
      lineWidth: 0.01,
    },
    bodyStyles: {
      lineWidth: 0.01,
      lineColor: [128, 128, 128],
      valign: "middle",
    },
    columnStyles: getEnhancedColumnStyles(filename),
    margin: { top: 1.5, left: 0.3, right: 0.3, bottom: 1.0 }, // Tighter margins like template
    tableWidth: "auto",
    theme: "grid",
    showHead: "everyPage",
    tableLineWidth: 0.01,
    tableLineColor: [128, 128, 128],
    didDrawCell: (data) => {
      // Apply professional formatting and status colors
      if (data.section === "body") {
        formatStatusCell(data.doc, data, filename);
      }
    },
    didDrawPage: (data) => {
      drawPdfFooter(data.doc);
    },
    // Enhanced table appearance
    horizontalPageBreak: true,
    horizontalPageBreakRepeat: 0,
  };
}

// Enhanced column styles matching template layout
function getEnhancedColumnStyles(filename: string): any {
  const commonStyles = {
    fontSize: pdfFonts.bodySize,
    cellPadding: { top: 0.08, right: 0.06, bottom: 0.08, left: 0.06 },
    valign: "middle" as const,
  };

  switch (filename) {
    case "trips-report":
      return {
        0: { ...commonStyles, cellWidth: 0.8, halign: "center" }, // DATE
        1: { ...commonStyles, cellWidth: 1.8, halign: "left" }, // CLIENT / PASSENGER(S)
        2: { ...commonStyles, cellWidth: 1.2, halign: "left" }, // ORGANIZATION
        3: { ...commonStyles, cellWidth: 1.0, halign: "left" }, // CONTACT
        4: { ...commonStyles, cellWidth: 1.2, halign: "center" }, // SERVICE TYPE
        5: { ...commonStyles, cellWidth: 1.5, halign: "left" }, // PICK-UP ADDRESS
        6: { ...commonStyles, cellWidth: 1.5, halign: "left" }, // DROP-OFF ADDRESS
        7: { ...commonStyles, cellWidth: 0.6, halign: "center" }, // TIME
        8: { ...commonStyles, cellWidth: 1.2, halign: "center" }, // CARRIER / FLIGHT #
        9: { ...commonStyles, cellWidth: 1.2, halign: "center" }, // ASSIGNED VEHICLE
        10: { ...commonStyles, cellWidth: 1.2, halign: "center" }, // ASSIGNED DRIVER
      };

    case "vehicles-report":
      return {
        0: { ...commonStyles, cellWidth: 2.5, halign: "left" }, // Vehicle (Make & Model)
        1: { ...commonStyles, cellWidth: 1.4, halign: "center" }, // Registration
        2: { ...commonStyles, cellWidth: 1.2, halign: "center" }, // Type
        3: { ...commonStyles, cellWidth: 0.8, halign: "center" }, // Year
        4: { ...commonStyles, cellWidth: 1.0, halign: "center" }, // Status
        5: { ...commonStyles, cellWidth: 1.6, halign: "center" }, // Insurance Expiry
      };

    case "drivers-report":
      return {
        0: { ...commonStyles, cellWidth: 2.0, halign: "left" }, // Driver Name
        1: { ...commonStyles, cellWidth: 2.2, halign: "left" }, // Contact Information
        2: { ...commonStyles, cellWidth: 1.5, halign: "center" }, // License Number
        3: { ...commonStyles, cellWidth: 1.2, halign: "center" }, // License Type
        4: { ...commonStyles, cellWidth: 1.2, halign: "center" }, // Expiry Date
        5: { ...commonStyles, cellWidth: 1.0, halign: "center" }, // Status
      };

    case "fuel-report":
      return {
        0: { ...commonStyles, cellWidth: 1.0, halign: "center" }, // Date
        1: { ...commonStyles, cellWidth: 2.2, halign: "left" }, // Vehicle
        2: { ...commonStyles, cellWidth: 1.0, halign: "center" }, // Fuel Type
        3: { ...commonStyles, cellWidth: 1.0, halign: "right" }, // Volume
        4: { ...commonStyles, cellWidth: 1.2, halign: "right" }, // Cost
        5: { ...commonStyles, cellWidth: 1.2, halign: "right" }, // Mileage
        6: { ...commonStyles, cellWidth: 1.2, halign: "right" }, // Efficiency
      };

    case "maintenance-report":
      return {
        0: { ...commonStyles, cellWidth: 1.0, halign: "center" }, // Date
        1: { ...commonStyles, cellWidth: 2.0, halign: "left" }, // Vehicle
        2: { ...commonStyles, cellWidth: 3.0, halign: "left" }, // Service Description
        3: { ...commonStyles, cellWidth: 1.0, halign: "center" }, // Status
        4: { ...commonStyles, cellWidth: 1.2, halign: "right" }, // Cost
        5: { ...commonStyles, cellWidth: 1.5, halign: "left" }, // Service Provider
      };

    case "financial-report":
      return {
        0: { ...commonStyles, cellWidth: 1.0, halign: "center" }, // Date
        1: { ...commonStyles, cellWidth: 1.8, halign: "left" }, // Description
        2: { ...commonStyles, cellWidth: 1.0, halign: "center" }, // Category
        3: { ...commonStyles, cellWidth: 1.2, halign: "right" }, // Amount
        4: { ...commonStyles, cellWidth: 1.0, halign: "center" }, // Type
        5: { ...commonStyles, cellWidth: 1.5, halign: "left" }, // Reference
      };

    default:
      // Enhanced generic column styles
      return {
        0: { ...commonStyles, cellWidth: "auto", halign: "left" },
        1: { ...commonStyles, cellWidth: "auto", halign: "left" },
        2: { ...commonStyles, cellWidth: "auto", halign: "center" },
        3: { ...commonStyles, cellWidth: "auto", halign: "center" },
        4: { ...commonStyles, cellWidth: "auto", halign: "center" },
        5: { ...commonStyles, cellWidth: "auto", halign: "center" },
      };
  }
}
