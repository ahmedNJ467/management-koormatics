
import { UserOptions } from "jspdf-autotable";
import { pdfColors, pdfFonts } from "./pdfStyles";
import { formatClientCell, formatStatusCell } from "./pdfCellFormatters";

// Generate enhanced table configuration for professional PDFs
export function getTableConfig(data: any[], filename: string, startY: number): UserOptions {
  return {
    startY,
    styles: {
      fontSize: pdfFonts.bodySize,
      cellPadding: { top: 0.15, right: 0.12, bottom: 0.15, left: 0.12 },
      lineWidth: 0.01,
      lineColor: pdfColors.light as [number, number, number],
      textColor: pdfColors.text,
      minCellHeight: 0.35,
      font: pdfFonts.bodyFont,
      valign: 'middle',
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: {
      fillColor: pdfColors.primary as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: { top: 0.2, right: 0.12, bottom: 0.2, left: 0.12 },
      fontSize: pdfFonts.bodySize + 1,
      minCellHeight: 0.4
    },
    alternateRowStyles: {
      fillColor: pdfColors.rowAlt as [number, number, number],
    },
    columnStyles: {
      // Enhanced column styling with better width distribution
      ...(filename === 'trips-report' ? {
        0: { cellWidth: 0.7 }, // Date
        1: { cellWidth: 1.8 }, // Client (reduced for better fit)
        2: { cellWidth: 1.2 }, // Service Type
        3: { cellWidth: 1.4 }, // Pickup
        4: { cellWidth: 1.4 }, // Dropoff
        5: { cellWidth: 1.0 }, // Vehicle
        6: { cellWidth: 0.9 }, // Driver
        7: { cellWidth: 0.8, fontStyle: 'bold' }, // Status
      } : {}),
      ...(filename === 'vehicles-report' ? {
        0: { cellWidth: 1.6 }, // Make & Model
        1: { cellWidth: 1.0 }, // Registration
        2: { cellWidth: 0.9 }, // Type
        3: { cellWidth: 0.7 }, // Year
        4: { cellWidth: 0.9, fontStyle: 'bold' }, // Status
        5: { cellWidth: 1.1 }, // Insurance Expiry
      } : {}),
      ...(filename === 'fuel-report' ? {
        0: { cellWidth: 0.7 }, // Date
        1: { cellWidth: 1.3 }, // Vehicle
        2: { cellWidth: 0.9 }, // Fuel Type
        3: { cellWidth: 0.7, halign: 'right' }, // Volume
        4: { cellWidth: 0.8, halign: 'right' }, // Cost
        5: { cellWidth: 0.9, halign: 'right' }, // Mileage
        6: { cellWidth: 0.9, halign: 'right' }, // Efficiency
      } : {}),
      ...(filename === 'maintenance-report' ? {
        0: { cellWidth: 0.7 }, // Date
        1: { cellWidth: 1.3 }, // Vehicle
        2: { cellWidth: 2.2 }, // Description
        3: { cellWidth: 0.9, fontStyle: 'bold' }, // Status
        4: { cellWidth: 0.8, halign: 'right' }, // Cost
        5: { cellWidth: 1.3 }, // Service Provider
      } : {}),
    },
    margin: { top: 2.3, left: 0.4, right: 0.4, bottom: 0.8 },
    tableWidth: 'auto',
    theme: 'grid',
    showHead: 'everyPage',
    didDrawCell: (data) => {
      // Apply special formatting for specific cells
      if (data.section === 'body' && data.column.index === 1 && filename === 'trips-report') {
        formatClientCell(data.doc, data, data.cell);
      }
      
      // Apply status color coding
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
