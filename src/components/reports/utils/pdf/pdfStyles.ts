
// Define Color as tuple type [number, number, number] for RGB values
export type Color = [number, number, number];

// Professional color scheme with a blue-green blend
export const pdfColors = {
  primary: [20, 83, 103] as Color,          // Dark Teal for headers and important text
  headerBg: [20, 83, 103] as Color,         // Dark Teal for header background
  headerText: [255, 255, 255] as Color,     // White header text
  text: [51, 51, 51] as Color,              // Dark Gray for body text
  border: [200, 200, 200] as Color,         // Light gray for borders
  rowAlt: [229, 245, 248] as Color,         // Very Light Teal for alternating rows
  statusRed: [255, 200, 200] as Color,      // Light red for status highlighting
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
