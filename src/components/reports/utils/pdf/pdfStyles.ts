
import { Color } from "jspdf-autotable";

// Enhanced professional color scheme with better contrast and readability
export const pdfColors = {
  primary: [41, 98, 255] as [number, number, number], // Professional Blue for headers and accents
  headerBg: [37, 87, 230] as [number, number, number], // Darker Blue for header background
  headerText: [255, 255, 255] as [number, number, number], // White header text for maximum contrast
  text: [44, 44, 44] as [number, number, number], // Charcoal for body text (better readability)
  border: [220, 220, 220] as [number, number, number], // Light gray for borders
  rowAlt: [248, 250, 252] as [number, number, number], // Very light blue-gray for alternating rows
  statusRed: [254, 242, 242] as [number, number, number], // Light red for status highlighting
  statusOrange: [255, 251, 235] as [number, number, number], // Light amber for status highlighting
  statusGreen: [240, 253, 244] as [number, number, number], // Light green for status highlighting
  light: [252, 252, 252] as [number, number, number], // Very light gray
  logoBackground: [255, 255, 255] as [number, number, number], // White background for logo visibility
  accent: [99, 102, 241] as [number, number, number], // Indigo accent color
  tableHeader: [30, 64, 175] as [number, number, number], // Deep blue for table headers
  divider: [229, 231, 235] as [number, number, number], // Light gray for dividers
};

// Enhanced configuration for better document layout
export const pdfConfig = {
  orientation: "landscape" as "landscape",
  format: "a4" as "a4",
  pageMargin: 0.6,
  companyName: "KOORMATICS",
  logoPath: "/koormatics-logo.svg",
  logoAspectRatio: 0.3,
};

// Professional typography with improved hierarchy
export const pdfFonts = {
  titleSize: 16, // Larger title for better hierarchy
  subtitleSize: 12, // Better subtitle size
  headerSize: 11, // Table header size
  bodySize: 10, // Body text size (increased for readability)
  smallSize: 9, // Small text size
  bodyFont: "helvetica",
  headerFont: "helvetica",
};

// Professional spacing configuration
export const pdfSpacing = {
  cellPadding: {
    top: 0.15,
    right: 0.12,
    bottom: 0.15,
    left: 0.12,
  },
  headerPadding: {
    top: 0.18,
    right: 0.12,
    bottom: 0.18,
    left: 0.12,
  },
  minCellHeight: 0.4,
  minHeaderHeight: 0.45,
  lineWidth: 0.01,
  headerLineWidth: 0.02,
};
