
import { UserOptions } from "jspdf-autotable";
import { pdfColors, pdfFonts } from "./pdfStyles";
import { formatStatusCell } from "./pdfCellFormatters";
import { drawPdfFooter } from "./pdfFooter";

// Professional table configuration with enhanced layout and styling
export function getTableConfig(data: any[], filename: string, startY: number): UserOptions {
  return {
    startY: startY,
    styles: {
      fontSize: pdfFonts.bodySize,
      cellPadding: { top: 0.12, right: 0.1, bottom: 0.12, left: 0.1 },
      lineWidth: 0.015,
      lineColor: pdfColors.border,
      textColor: pdfColors.text,
      minCellHeight: 0.35,
      font: pdfFonts.bodyFont,
      valign: 'middle',
      overflow: 'linebreak',
      cellWidth: 'wrap',
      halign: 'left'
    },
    headStyles: {
      fillColor: pdfColors.headerBg,
      textColor: pdfColors.headerText,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 0.15, right: 0.1, bottom: 0.15, left: 0.1 },
      fontSize: pdfFonts.bodySize + 1,
      minCellHeight: 0.4,
      lineWidth: 0.02,
      lineColor: pdfColors.primary
    },
    alternateRowStyles: {
      fillColor: pdfColors.rowAlt,
    },
    bodyStyles: {
      lineWidth: 0.01,
      lineColor: pdfColors.border,
    },
    columnStyles: getColumnStyles(filename),
    margin: { top: 2.0, left: 0.5, right: 0.5, bottom: 1.0 },
    tableWidth: 'auto',
    theme: 'grid',
    showHead: 'everyPage',
    tableLineWidth: 0.015,
    tableLineColor: pdfColors.border,
    didDrawCell: (data) => {
      // Apply professional formatting and status colors
      if (data.section === 'body') {
        formatStatusCell(data.doc, data, filename);
      }
    },
    didDrawPage: (data) => {
      drawPdfFooter(data.doc);
    }
  };
}

// Enhanced column styling for different report types with better spacing
function getColumnStyles(filename: string): any {
  const baseStyles = {
    0: { halign: 'left' },
    1: { halign: 'left' },
    2: { halign: 'center' },
    3: { halign: 'center' },
    4: { halign: 'center' },
    5: { halign: 'left' },
  };

  switch (filename) {
    case 'trips-report':
      return {
        0: { cellWidth: 1.0, halign: 'center', fontSize: pdfFonts.bodySize }, // Date
        1: { cellWidth: 2.2, halign: 'left', fontSize: pdfFonts.bodySize },   // Client/Passenger
        2: { cellWidth: 1.6, halign: 'left', fontSize: pdfFonts.bodySize },   // Organization
        3: { cellWidth: 1.3, halign: 'center', fontSize: pdfFonts.bodySize }, // Contact
        4: { cellWidth: 1.4, halign: 'center', fontSize: pdfFonts.bodySize }, // Service Type
        5: { cellWidth: 1.8, halign: 'left', fontSize: pdfFonts.bodySize },   // Pickup
        6: { cellWidth: 1.8, halign: 'left', fontSize: pdfFonts.bodySize },   // Dropoff
        7: { cellWidth: 0.9, halign: 'center', fontSize: pdfFonts.bodySize }, // Time
        8: { cellWidth: 1.1, halign: 'center', fontSize: pdfFonts.bodySize }, // Flight
        9: { cellWidth: 1.5, halign: 'center', fontSize: pdfFonts.bodySize }, // Vehicle
        10: { cellWidth: 1.4, halign: 'center', fontSize: pdfFonts.bodySize }, // Driver
      };
      
    case 'vehicles-report':
      return {
        0: { cellWidth: 2.8, halign: 'left', fontSize: pdfFonts.bodySize },   // Make & Model
        1: { cellWidth: 1.6, halign: 'center', fontSize: pdfFonts.bodySize }, // Registration
        2: { cellWidth: 1.3, halign: 'center', fontSize: pdfFonts.bodySize }, // Type
        3: { cellWidth: 1.1, halign: 'center', fontSize: pdfFonts.bodySize }, // Year
        4: { cellWidth: 1.3, halign: 'center', fontSize: pdfFonts.bodySize }, // Status
        5: { cellWidth: 1.9, halign: 'center', fontSize: pdfFonts.bodySize }, // Insurance
      };
      
    case 'drivers-report':
      return {
        0: { cellWidth: 2.2, halign: 'left', fontSize: pdfFonts.bodySize },   // Name
        1: { cellWidth: 1.9, halign: 'left', fontSize: pdfFonts.bodySize },   // Contact
        2: { cellWidth: 1.6, halign: 'center', fontSize: pdfFonts.bodySize }, // License Number
        3: { cellWidth: 1.3, halign: 'center', fontSize: pdfFonts.bodySize }, // License Type
        4: { cellWidth: 1.6, halign: 'center', fontSize: pdfFonts.bodySize }, // Expiry
        5: { cellWidth: 1.3, halign: 'center', fontSize: pdfFonts.bodySize }, // Status
      };
      
    case 'fuel-report':
      return {
        0: { cellWidth: 1.3, halign: 'center', fontSize: pdfFonts.bodySize }, // Date
        1: { cellWidth: 2.2, halign: 'left', fontSize: pdfFonts.bodySize },   // Vehicle
        2: { cellWidth: 1.3, halign: 'center', fontSize: pdfFonts.bodySize }, // Fuel Type
        3: { cellWidth: 1.1, halign: 'right', fontSize: pdfFonts.bodySize },  // Volume
        4: { cellWidth: 1.3, halign: 'right', fontSize: pdfFonts.bodySize },  // Cost
        5: { cellWidth: 1.6, halign: 'right', fontSize: pdfFonts.bodySize },  // Mileage
        6: { cellWidth: 1.3, halign: 'right', fontSize: pdfFonts.bodySize },  // Efficiency
      };
      
    case 'maintenance-report':
      return {
        0: { cellWidth: 1.3, halign: 'center', fontSize: pdfFonts.bodySize }, // Date
        1: { cellWidth: 2.2, halign: 'left', fontSize: pdfFonts.bodySize },   // Vehicle
        2: { cellWidth: 2.8, halign: 'left', fontSize: pdfFonts.bodySize },   // Description
        3: { cellWidth: 1.3, halign: 'center', fontSize: pdfFonts.bodySize }, // Status
        4: { cellWidth: 1.3, halign: 'right', fontSize: pdfFonts.bodySize },  // Cost
        5: { cellWidth: 1.6, halign: 'center', fontSize: pdfFonts.bodySize }, // Provider
      };
      
    default:
      return baseStyles;
  }
}
