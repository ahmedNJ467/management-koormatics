
import { UserOptions } from "jspdf-autotable";
import { pdfColors, pdfFonts } from "./pdfStyles";
import { formatClientCell, formatStatusCell } from "./pdfCellFormatters";

// Generate the table configuration for autoTable
export function getTableConfig(data: any[], filename: string, startY: number): UserOptions {
  return {
    startY,
    styles: {
      fontSize: pdfFonts.bodySize,
      cellPadding: { top: 0.18, right: 0.15, bottom: 0.18, left: 0.15 },
      lineWidth: 0, // Remove grid lines
      textColor: pdfColors.text,
      minCellHeight: 0.4,
      font: pdfFonts.bodyFont
    },
    headStyles: {
      fillColor: pdfColors.primary,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 0.2, right: 0.15, bottom: 0.2, left: 0.15 },
    },
    alternateRowStyles: {
      fillColor: pdfColors.rowAlt,
    },
    margin: { top: 2.0, left: 0.5, right: 0.5, bottom: 0.8 },
    tableWidth: 'auto',
    columnStyles: {
      1: { // Client column (index 1)
        cellWidth: 2.5, // Make Client column wider
        cellPadding: { top: 0.2, right: 0.15, bottom: 0.2, left: 0.15 },
        fillColor: [15, 23, 42, 0.97], // Dark background for client column like in the image
        textColor: [255, 255, 255], // White text for client name
      },
      // Add color coding for status column based on report type
      ...(filename === 'vehicles-report' ? {
        5: { // Status column for vehicles-report
          fontStyle: 'bold',
        }
      } : {}),
      ...(filename === 'maintenance-report' ? {
        3: { // Status column for maintenance-report
          fontStyle: 'bold',
        }
      } : {}),
      ...(filename === 'trips-report' ? {
        2: { // Service type column styling
          fillColor: pdfColors.light
        }
      } : {})
    },
    didDrawCell: (data) => {
      // Apply special formatting for client column with passengers
      if (data.section === 'body' && data.column.index === 1) {
        formatClientCell(data.doc, data, data.cell);
      }
      
      // Color code status values based on their values
      if (data.section === 'body') {
        formatStatusCell(data.doc, data, filename);
      }
    },
    didDrawPage: (data) => {
      drawPdfFooter(data.doc);
    }
  };
}

// Import the footer function to use in the table config
import { drawPdfFooter } from "./pdfFooter";
