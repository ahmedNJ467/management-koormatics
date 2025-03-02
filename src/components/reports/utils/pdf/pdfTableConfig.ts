
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
      halign: 'left', // Align header text to left to match body cells
      cellPadding: { top: 0.2, right: 0.15, bottom: 0.2, left: 0.15 },
    },
    alternateRowStyles: {
      fillColor: pdfColors.rowAlt as [number, number, number],
    },
    margin: { top: 2.0, left: 0.6, right: 0.6, bottom: 0.8 }, // Increased side margins
    tableWidth: 'auto',
    columnStyles: {
      0: { // Date column (index 0)
        cellWidth: 0.9,
      },
      1: { // Client column (index 1)
        cellWidth: 1.8, // Reduced width
        cellPadding: { top: 0.2, right: 0.15, bottom: 0.2, left: 0.15 },
        // Don't set fillColor here, we'll handle it in didDrawCell
        fontStyle: 'normal',
      },
      2: { // Service Type column (index 2)
        cellWidth: 1.6, // Reduced width
        cellPadding: { top: 0.2, right: 0.1, bottom: 0.2, left: 0.1 },
      },
      3: { // Pick-up column (index 3)
        cellWidth: 1.3, // Reduced width
      },
      4: { // Drop-off column (index 4)
        cellWidth: 1.3, // Reduced width
      },
      5: { // Vehicle column (index 5)
        cellWidth: 1.3, // Reduced width
      },
      6: { // Driver column (index 6)
        cellWidth: 1.2, // Reduced width
      },
      7: { // Status column (index 7)
        cellWidth: 0.9, // Reduced width
        fontStyle: 'bold'
      },
      // Status column styling for other report types
      ...(filename === 'vehicles-report' ? {
        5: { fontStyle: 'bold' }
      } : {}),
      ...(filename === 'maintenance-report' ? {
        3: { fontStyle: 'bold' }
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
