
import { UserOptions } from "jspdf-autotable";
import { pdfColors, pdfFonts } from "./pdfStyles";
import { formatClientCell, formatStatusCell } from "./pdfCellFormatters";

// Generate enhanced table configuration for professional PDFs
export function getTableConfig(data: any[], filename: string, startY: number): UserOptions {
  return {
    startY,
    styles: {
      fontSize: pdfFonts.bodySize,
      cellPadding: { top: 0.2, right: 0.15, bottom: 0.2, left: 0.15 },
      lineWidth: 0.01,
      lineColor: pdfColors.light as [number, number, number],
      textColor: pdfColors.text,
      minCellHeight: 0.45,
      font: pdfFonts.bodyFont,
      valign: 'middle'
    },
    headStyles: {
      fillColor: pdfColors.primary as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: { top: 0.25, right: 0.15, bottom: 0.25, left: 0.15 },
      fontSize: pdfFonts.bodySize + 1,
    },
    alternateRowStyles: {
      fillColor: pdfColors.rowAlt as [number, number, number],
    },
    columnStyles: {
      // Enhanced column styling based on report type
      ...(filename === 'trips-report' ? {
        0: { cellWidth: 0.8 }, // Date
        1: { cellWidth: 2.2 }, // Client (wider for organization info)
        2: { cellWidth: 1.4 }, // Service Type
        3: { cellWidth: 1.6 }, // Pickup
        4: { cellWidth: 1.6 }, // Dropoff
        5: { cellWidth: 1.2 }, // Vehicle
        6: { cellWidth: 1.0 }, // Driver
        7: { cellWidth: 1.0, fontStyle: 'bold' }, // Status
      } : {}),
      ...(filename === 'vehicles-report' ? {
        0: { cellWidth: 1.8 }, // Make & Model
        1: { cellWidth: 1.2 }, // Registration
        2: { cellWidth: 1.0 }, // Type
        3: { cellWidth: 0.8 }, // Year
        4: { cellWidth: 1.0, fontStyle: 'bold' }, // Status
        5: { cellWidth: 1.2 }, // Insurance Expiry
      } : {}),
      ...(filename === 'fuel-report' ? {
        0: { cellWidth: 0.8 }, // Date
        1: { cellWidth: 1.5 }, // Vehicle
        2: { cellWidth: 1.0 }, // Fuel Type
        3: { cellWidth: 0.8, halign: 'right' }, // Volume
        4: { cellWidth: 1.0, halign: 'right' }, // Cost
        5: { cellWidth: 1.0, halign: 'right' }, // Mileage
        6: { cellWidth: 1.0, halign: 'right' }, // Efficiency
      } : {}),
      ...(filename === 'maintenance-report' ? {
        0: { cellWidth: 0.8 }, // Date
        1: { cellWidth: 1.5 }, // Vehicle
        2: { cellWidth: 2.5 }, // Description
        3: { cellWidth: 1.0, fontStyle: 'bold' }, // Status
        4: { cellWidth: 1.0, halign: 'right' }, // Cost
        5: { cellWidth: 1.5 }, // Service Provider
      } : {}),
    },
    margin: { top: 3.2, left: 0.5, right: 0.5, bottom: 1.0 },
    tableWidth: 'auto',
    theme: 'grid',
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
