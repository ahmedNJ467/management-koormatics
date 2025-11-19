// Utility to convert Lucide React icons to SVG data URLs for use in map markers
import { getLucideIcon } from "./lucide-icon-mapping";
import * as lucideIcons from "lucide";
import React from "react";
import { renderToString } from "react-dom/server";

/**
 * Mapping from Material Icon names to Lucide icon names (as strings)
 * This allows us to get the icon data from the lucide package
 */
const MATERIAL_TO_LUCIDE_NAME_MAP: Record<string, string> = {
  // Places & Locations
  place: "MapPin",
  location_on: "MapPin",
  location_city: "Building2",
  pin_drop: "Pin",
  my_location: "Navigation",
  near_me: "Navigation2",
  room: "Home",
  explore: "Compass",
  map: "Map",
  navigation: "Navigation",
  directions: "Route",
  
  // Security & Checkpoints
  security: "Shield",
  shield: "Shield",
  verified_user: "Verified",
  local_police: "Shield",
  warning: "AlertTriangle",
  check_circle: "CheckCircle2",
  verified: "Verified",
  lock: "Lock",
  lock_outline: "Lock",
  gavel: "Gavel",
  
  // Shopping & Market
  store: "Store",
  shopping_cart: "ShoppingCart",
  local_grocery_store: "ShoppingCart",
  storefront: "Store",
  shopping_bag: "ShoppingBag",
  local_mall: "Store",
  inventory: "Warehouse",
  warehouse: "Warehouse",
  local_shipping: "Truck",
  
  // Fuel
  local_gas_station: "Fuel",
  local_fire_department: "Flame",
  oil_barrel: "Droplet",
  fuel: "Fuel",
  gas_station: "Fuel",
  
  // Health
  local_hospital: "Hospital",
  medical_services: "HeartPulse",
  health_and_safety: "HeartPulse",
  medication: "Pill",
  local_pharmacy: "Pill",
  emergency: "AlertTriangle",
  healing: "HeartPulse",
  vaccines: "Pill",
  
  // Restaurant
  restaurant: "UtensilsCrossed",
  local_dining: "UtensilsCrossed",
  fastfood: "UtensilsCrossed",
  coffee: "Coffee",
  local_cafe: "Coffee",
  bakery_dining: "UtensilsCrossed",
  local_pizza: "Pizza",
  ramen_dining: "UtensilsCrossed",
  icecream: "IceCream",
  
  // Hotel
  hotel: "Hotel",
  bed: "Bed",
  room_service: "UtensilsCrossed",
  ac_unit: "Waves",
  pool: "Waves",
  wifi: "Wifi",
  restaurant_menu: "Menu",
  
  // Bank & Finance
  account_balance: "Landmark",
  savings: "Wallet",
  credit_card: "CreditCard",
  atm: "CreditCard",
  account_balance_wallet: "Wallet",
  monetization_on: "Wallet",
  attach_money: "Wallet",
  local_atm: "CreditCard",
  
  // School
  school: "School",
  library_books: "BookOpen",
  menu_book: "BookOpen",
  science: "Computer",
  computer: "Computer",
  sports_soccer: "Computer",
  music_note: "Music",
  
  // General
  palette: "Palette",
  brain: "Brain",
  church: "Church",
  star: "Star",
  heart: "Heart",
  bookmark: "Bookmark",
  flag: "Flag",
  search: "Search",
};

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

  try {
    // Get the Lucide icon name from the mapping
    const normalizedName = iconName.toLowerCase().trim();
    const lucideIconName = MATERIAL_TO_LUCIDE_NAME_MAP[normalizedName] || "MapPin";
    
    // Get the icon from lucide package
    const IconComponent = (lucideIcons as any)[lucideIconName];
    
    if (!IconComponent) {
      // Fallback to MapPin
      return getMapPinSvg(color, size);
    }

    // Render the icon to SVG string using react-dom/server
    // This works in both server and client contexts in Next.js
    try {
      const iconElement = React.createElement(IconComponent, {
        size: size,
        color: color,
        strokeWidth: 2,
      });
      
      const svgString = renderToString(iconElement);
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
      return svgDataUrl;
    } catch (renderError) {
      // If rendering fails, fallback to MapPin
      console.warn("Failed to render Lucide icon to SVG:", renderError);
      return getMapPinSvg(color, size);
    }
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

