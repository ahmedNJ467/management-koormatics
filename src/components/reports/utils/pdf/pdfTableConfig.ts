
import { UserOptions } from "jspdf-autotable";
import { pdfColors, pdfFonts } from "./pdfStyles";
import { formatStatusCell } from "./pdfCellFormatters";
import { drawPdfFooter } from "./pdfFooter";

// Professional table configuration with improved layout
export function getTableConfig(data: any[], filename: string, startY: number): UserOptions {
  return {
    startY: startY,
    styles: {
      fontSize: pdfFonts.bodySize,
      cellPadding: { top: 0.1, right: 0.08, bottom: 0.1, left: 0.08 },
      lineWidth: 0.01,
      lineColor: pdfColors.border,
      textColor: pdfColors.text,
      minCellHeight: 0.3,
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
      cellPadding: { top: 0.12, right: 0.08, bottom: 0.12, left: 0.08 },
      fontSize: pdfFonts.bodySize + 1,
      minCellHeight: 0.35
    },
    alternateRowStyles: {
      fillColor: pdfColors.rowAlt,
    },
    columnStyles: getColumnStyles(filename),
    margin: { top: 1.8, left: 0.5, right: 0.5, bottom: 0.8 },
    tableWidth: 'auto',
    theme: 'grid',
    showHead: 'everyPage',
    tableLineWidth: 0.01,
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

// Enhanced column styling for different report types
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
        0: { cellWidth: 1.0, halign: 'center' }, // Date
        1: { cellWidth: 2.0, halign: 'left' },   // Client/Passenger
        2: { cellWidth: 1.5, halign: 'left' },   // Organization
        3: { cellWidth: 1.2, halign: 'center' }, // Contact
        4: { cellWidth: 1.3, halign: 'center' }, // Service Type
        5: { cellWidth: 1.8, halign: 'left' },   // Pickup
        6: { cellWidth: 1.8, halign: 'left' },   // Dropoff
        7: { cellWidth: 0.8, halign: 'center' }, // Time
        8: { cellWidth: 1.0, halign: 'center' }, // Flight
        9: { cellWidth: 1.5, halign: 'center' }, // Vehicle
        10: { cellWidth: 1.3, halign: 'center' }, // Driver
      };
      
    case 'vehicles-report':
      return {
        0: { cellWidth: 2.5, halign: 'left' },   // Make & Model
        1: { cellWidth: 1.5, halign: 'center' }, // Registration
        2: { cellWidth: 1.2, halign: 'center' }, // Type
        3: { cellWidth: 1.0, halign: 'center' }, // Year
        4: { cellWidth: 1.2, halign: 'center' }, // Status
        5: { cellWidth: 1.8, halign: 'center' }, // Insurance
      };
      
    case 'drivers-report':
      return {
        0: { cellWidth: 2.0, halign: 'left' },   // Name
        1: { cellWidth: 1.8, halign: 'left' },   // Contact
        2: { cellWidth: 1.5, halign: 'center' }, // License Number
        3: { cellWidth: 1.2, halign: 'center' }, // License Type
        4: { cellWidth: 1.5, halign: 'center' }, // Expiry
        5: { cellWidth: 1.2, halign: 'center' }, // Status
      };
      
    case 'fuel-report':
      return {
        0: { cellWidth: 1.2, halign: 'center' }, // Date
        1: { cellWidth: 2.0, halign: 'left' },   // Vehicle
        2: { cellWidth: 1.2, halign: 'center' }, // Fuel Type
        3: { cellWidth: 1.0, halign: 'right' },  // Volume
        4: { cellWidth: 1.2, halign: 'right' },  // Cost
        5: { cellWidth: 1.5, halign: 'right' },  // Mileage
        6: { cellWidth: 1.2, halign: 'right' },  // Efficiency
      };
      
    case 'maintenance-report':
      return {
        0: { cellWidth: 1.2, halign: 'center' }, // Date
        1: { cellWidth: 2.0, halign: 'left' },   // Vehicle
        2: { cellWidth: 2.5, halign: 'left' },   // Description
        3: { cellWidth: 1.2, halign: 'center' }, // Status
        4: { cellWidth: 1.2, halign: 'right' },  // Cost
        5: { cellWidth: 1.5, halign: 'center' }, // Provider
      };
      
    default:
      return baseStyles;
  }
}
