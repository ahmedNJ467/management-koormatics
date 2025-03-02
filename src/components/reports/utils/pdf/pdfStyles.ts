
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
  rowAlt: [245, 246, 250] as Color      // #f5f6fa - Very light blue-gray
};

// Document configuration
export const pdfConfig = {
  pageMargin: 0.5,
  logoPath: 'lovable-uploads/3900a10d-0eb8-4894-a90e-73841e2422de.png',
  companyName: 'PBG MOVEMENT & SAFETY DEPT.',
  format: [11, 8.5] as [number, number], // Wider PDF (11 inches width, 8.5 inches height)
  orientation: 'landscape' as const
};

// Define font sizes and styles
export const pdfFonts = {
  titleSize: 22,
  subtitleSize: 18,
  bodySize: 10,
  smallSize: 9,
  bodyFont: 'helvetica'
};
