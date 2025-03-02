
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
      fillColor: pdfColors.primary as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: { top: 0.2, right: 0.15, bottom: 0.2, left: 0.15 },
    },
    alternateRowStyles: {
      fillColor: pdfColors.rowAlt as [number, number, number],
    },
    margin: { top: 2.0, left: 0.5, right: 0.5, bottom: 0.8 },
    tableWidth: 'auto',
    columnStyles: {
      1: { // Client column (index 1)
        cellWidth: 2.5, // Make Client column wider
        cellPadding: { top: 0.2, right: 0.15, bottom: 0.2, left: 0.15 },
        // Don't set fillColor here, we'll handle it in didDrawCell
        fontStyle: 'normal',
      },
      // Status column styling
      ...(filename === 'vehicles-report' ? {
        5: { fontStyle: 'bold' }
      } : {}),
      ...(filename === 'maintenance-report' ? {
        3: { fontStyle: 'bold' }
      } : {}),
      ...(filename === 'trips-report' ? {
        7: { fontStyle: 'bold' } // Status column for trips is now at index 7
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
