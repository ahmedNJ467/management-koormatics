
// Define Color as tuple type [number, number, number] for RGB values
export type Color = [number, number, number];

// Professional color scheme optimized for better visibility and contrast
export const pdfColors = {
  primary: [34, 139, 34] as Color,           // Forest Green for headers and important text
  headerBg: [46, 125, 50] as Color,          // Medium Green for header background
  headerText: [255, 255, 255] as Color,      // White header text for maximum contrast
  text: [33, 33, 33] as Color,               // Dark Gray for body text
  border: [189, 189, 189] as Color,          // Medium gray for borders
  rowAlt: [240, 248, 240] as Color,          // Very Light Green for alternating rows
  statusRed: [255, 235, 238] as Color,       // Light red for status highlighting
  statusOrange: [255, 243, 224] as Color,    // Light orange for status highlighting
  statusGreen: [232, 245, 233] as Color,     // Light green for status highlighting
  light: [250, 250, 250] as Color,           // Very light gray
  logoBackground: [255, 255, 255] as Color   // White background for logo visibility
};

// Document configuration for professional appearance
export const pdfConfig = {
  pageMargin: 0.5,
  logoPath: '/lovable-uploads/6996f29f-4f5b-4a22-ba41-51dc5c98afb7.png',
  logoAspectRatio: 123 / 622, // height / width, based on original image dimensions
  companyName: 'Koormatics Management',
  format: [11.69, 8.27] as [number, number], // A4 landscape
  orientation: 'landscape' as const
};

// Professional font configuration
export const pdfFonts = {
  titleSize: 14,
  subtitleSize: 11,
  bodySize: 9,
  smallSize: 8,
  bodyFont: 'helvetica'
};
