
import { UserOptions } from "jspdf-autotable";
import { pdfColors, pdfFonts } from "./pdfStyles";
import { formatClientCell, formatStatusCell } from "./pdfCellFormatters";

// Professional table configuration matching the example
export function getTableConfig(data: any[], filename: string, startY: number): UserOptions {
  return {
    startY: startY + 0.1,
    styles: {
      fontSize: pdfFonts.bodySize,
      cellPadding: { top: 0.08, right: 0.05, bottom: 0.08, left: 0.05 },
      lineWidth: 0.01,
      lineColor: pdfColors.border,
      textColor: pdfColors.text,
      minCellHeight: 0.25,
      font: pdfFonts.bodyFont,
      valign: 'middle',
      overflow: 'linebreak',
      cellWidth: 'wrap',
      halign: 'center'
    },
    headStyles: {
      fillColor: pdfColors.headerBg,
      textColor: pdfColors.headerText,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 0.1, right: 0.05, bottom: 0.1, left: 0.05 },
      fontSize: pdfFonts.bodySize,
      minCellHeight: 0.3
    },
    alternateRowStyles: {
      fillColor: pdfColors.rowAlt,
    },
    columnStyles: {
      // Professional column styling with precise widths like the example
      ...(filename === 'trips-report' ? {
        0: { cellWidth: 0.8, halign: 'center' }, // Date
        1: { cellWidth: 1.4, halign: 'left' },   // Client
        2: { cellWidth: 1.0, halign: 'center' }, // Organisation
        3: { cellWidth: 0.8, halign: 'center' }, // Contact
        4: { cellWidth: 0.9, halign: 'center' }, // Service Type
        5: { cellWidth: 1.3, halign: 'left' },   // Pickup
        6: { cellWidth: 1.3, halign: 'left' },   // Dropoff
        7: { cellWidth: 0.6, halign: 'center' }, // Time
        8: { cellWidth: 1.0, halign: 'center' }, // Carrier/Flight
        9: { cellWidth: 1.2, halign: 'center' }, // Vehicle
        10: { cellWidth: 1.2, halign: 'center' }, // Driver
      } : {}),
      ...(filename === 'vehicles-report' ? {
        0: { cellWidth: 1.8, halign: 'left' },   // Make & Model
        1: { cellWidth: 1.2, halign: 'center' }, // Registration
        2: { cellWidth: 1.0, halign: 'center' }, // Type
        3: { cellWidth: 0.8, halign: 'center' }, // Year
        4: { cellWidth: 1.0, halign: 'center' }, // Status
        5: { cellWidth: 1.2, halign: 'center' }, // Insurance
      } : {}),
    },
    margin: { top: 1.0, left: 0.5, right: 0.5, bottom: 0.6 },
    tableWidth: 'auto',
    theme: 'grid',
    showHead: 'everyPage',
    tableLineWidth: 0.01,
    tableLineColor: pdfColors.border,
    didDrawCell: (data) => {
      // Apply status color coding similar to the example
      if (data.section === 'body') {
        formatStatusCell(data.doc, data, filename);
      }
    },
    didDrawPage: (data) => {
      drawPdfFooter(data.doc);
    }
  };
}

// Import the footer function
import { drawPdfFooter } from "./pdfFooter";
