// Utility to convert Lucide React icons to SVG data URLs for use in map markers
import { getLucideIcon } from "./lucide-icon-mapping";
import { LucideIcon } from "lucide-react";

/**
 * Converts a Lucide icon to an SVG data URL
 * @param iconName - The Material Icon name (will be mapped to Lucide)
 * @param color - Icon color (default: currentColor)
 * @param size - Icon size in pixels (default: 24)
 * @returns SVG data URL string
 */
export function getLucideIconSvgUrl(
  iconName?: string,
  color: string = "currentColor",
  size: number = 24
): string {
  if (!iconName) {
    iconName = "place"; // Default icon
  }

  const IconComponent = getLucideIcon(iconName);
  if (!IconComponent) {
    // Fallback to MapPin
    return getMapPinSvg(color, size);
  }

  // Create a temporary element to render the icon
  // Note: This is a simplified approach. For production, you might want to use
  // a more robust method or pre-generate SVGs
  try {
    // For now, we'll create a simple SVG wrapper
    // In a real implementation, you'd render the icon to SVG
    const svgContent = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
      </svg>
    `.trim();

    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  } catch (error) {
    console.warn("Error creating SVG from Lucide icon:", error);
    return getMapPinSvg(color, size);
  }
}

/**
 * Creates a simple MapPin SVG as fallback
 */
function getMapPinSvg(color: string = "currentColor", size: number = 24): string {
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
}

/**
 * Gets icon color based on category
 */
export function getIconColorForCategory(category: string): string {
  const colorMap: Record<string, string> = {
    places: "#3b82f6", // Blue
    checkpoints: "#ef4444", // Red
    security: "#ef4444", // Red
    market: "#10b981", // Green
    fuel: "#f59e0b", // Amber
    health: "#ec4899", // Pink
    restaurant: "#f97316", // Orange
    hotel: "#8b5cf6", // Purple
    bank: "#06b6d4", // Cyan
    school: "#6366f1", // Indigo
    mosque: "#14b8a6", // Teal
    general: "#6b7280", // Gray
  };

  return colorMap[category] || "#6b7280";
}

