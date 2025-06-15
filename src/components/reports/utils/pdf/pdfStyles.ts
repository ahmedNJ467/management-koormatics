// Define Color as tuple type [number, number, number] for RGB values
export type Color = [number, number, number];

// Professional color scheme matching the example
export const pdfColors = {
  primary: [0, 0, 0] as Color,           // Black for text and borders
  headerBg: [0, 0, 0] as Color,          // Black header background
  headerText: [255, 255, 255] as Color,  // White header text
  text: [0, 0, 0] as Color,              // Black text
  border: [0, 0, 0] as Color,            // Black borders
  rowAlt: [245, 245, 245] as Color,      // Light gray for alternating rows
  statusRed: [255, 200, 200] as Color,   // Light red for status highlighting
  statusOrange: [255, 235, 200] as Color, // Light orange for status highlighting
  statusGreen: [200, 255, 200] as Color, // Light green for status highlighting
  light: [248, 248, 248] as Color        // Very light gray
};

// Document configuration for professional appearance
export const pdfConfig = {
  pageMargin: 0.5,
  logoPath: '/lovable-uploads/6996f29f-4f5b-4a22-ba41-51dc5c98afb7.png',
  logoAspectRatio: 123 / 622, // height / width, based on original image dimensions
  companyName: 'Koormatics',
  format: [11.69, 8.27] as [number, number], // A4 landscape
  orientation: 'landscape' as const
};

// Professional font configuration
export const pdfFonts = {
  titleSize: 12,
  subtitleSize: 10,
  bodySize: 8,
  smallSize: 7,
  bodyFont: 'helvetica'
};
