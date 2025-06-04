
// Define Color as tuple type [number, number, number] for RGB values
export type Color = [number, number, number];

// Modern color scheme with proper tuple types
export const pdfColors = {
  primary: [41, 128, 185] as Color,     // #2980b9 - Bright blue
  secondary: [142, 68, 173] as Color,   // #8e44ad - Purple
  accent: [39, 174, 96] as Color,       // #27ae60 - Green
  light: [236, 240, 241] as Color,      // #ecf0f1 - Light gray
  dark: [52, 73, 94] as Color,          // #34495e - Dark blue-gray
  text: [44, 62, 80] as Color,          // #2c3e50 - Almost black
  headerBg: [52, 152, 219] as Color,    // #3498db - Light blue
  rowAlt: [248, 249, 250] as Color      // #f8f9fa - Very light gray
};

// Document configuration - optimized for better content visibility
export const pdfConfig = {
  pageMargin: 0.4,
  logoPath: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Transparent 1x1 pixel fallback
  companyName: 'PBG MOVEMENT & SAFETY DEPT.',
  format: [11.69, 8.27] as [number, number], // A4 landscape (11.69 x 8.27 inches)
  orientation: 'landscape' as const
};

// Define font sizes and styles - optimized for better readability
export const pdfFonts = {
  titleSize: 20,
  subtitleSize: 16,
  bodySize: 9,
  smallSize: 8,
  bodyFont: 'helvetica'
};
