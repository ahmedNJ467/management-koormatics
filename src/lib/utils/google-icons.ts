// Utility functions for Google Material Icons integration

/**
 * Safely generates a Google Material Icons URL
 * @param iconName - The name of the Material Icon
 * @returns A valid Google Material Icons URL or fallback
 */
export function getGoogleIconUrl(iconName?: string): string {
  try {
    // Validate icon name - handle undefined/null cases
    if (!iconName || typeof iconName !== "string" || iconName.trim() === "") {
      // Don't log warnings for undefined values to reduce console spam
      if (iconName !== undefined && iconName !== null) {
        console.warn("Invalid icon name provided:", iconName);
      }
      return getFallbackIconUrl();
    }

    // Sanitize icon name (remove any potentially dangerous characters)
    const sanitizedIconName = iconName.replace(/[^a-zA-Z0-9_-]/g, "");

    if (sanitizedIconName !== iconName) {
      console.warn(
        `Icon name sanitized: "${iconName}" -> "${sanitizedIconName}"`
      );
    }

    const url = `https://fonts.gstatic.com/s/i/materialicons/${sanitizedIconName}/v1/24px.svg`;

    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.debug("Generated Google icon URL:", url);
    }

    return url;
  } catch (error) {
    console.warn(
      "Error generating Google icon URL:",
      error,
      "for icon:",
      iconName
    );
    return getFallbackIconUrl();
  }
}

/**
 * Gets a fallback icon URL when the primary icon fails
 * @returns A fallback Google Material Icons URL
 */
export function getFallbackIconUrl(): string {
  return `https://fonts.gstatic.com/s/i/materialicons/place/v1/24px.svg`;
}

/**
 * Safely handles image load errors
 * @param event - The error event from the image
 * @param fallbackElement - Optional fallback element to show
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackElement?: HTMLElement
): void {
  try {
    if (!event || !event.currentTarget) {
      console.warn("Invalid event object in handleImageError");
      return;
    }

    const target = event.currentTarget;
    if (target && target.style) {
      target.style.display = "none";
    }

    if (fallbackElement && fallbackElement.style) {
      fallbackElement.style.display = "block";
    }
  } catch (error) {
    console.warn("Error handling image load failure:", error);
  }
}

/**
 * Gets theme-aware icon styling
 * @param isDark - Whether the current theme is dark
 * @param color - Optional custom color
 * @returns CSS styles for the icon
 */
export function getThemeAwareIconStyle(
  isDark: boolean,
  color?: string
): React.CSSProperties {
  if (isDark) {
    // In dark mode, invert the icons to make them white/light
    return {
      filter: "invert(1) brightness(0.9)",
      opacity: 0.9,
    };
  } else {
    // In light mode, keep icons dark but ensure they're visible
    return {
      filter: "none",
      opacity: 0.8,
    };
  }
}

/**
 * Validates if an icon name is a valid Material Icon
 * @param iconName - The icon name to validate
 * @returns True if the icon name appears valid
 */
export function isValidIconName(iconName: string): boolean {
  if (!iconName || typeof iconName !== "string") {
    return false;
  }

  // Basic validation - Material Icons typically use lowercase with underscores
  const validPattern = /^[a-z][a-z0-9_]*[a-z0-9]$/;
  return validPattern.test(iconName);
}

/**
 * Common Material Icons for different categories
 */
export const COMMON_ICONS = {
  places: ["place", "location_on", "location_city", "home", "business"],
  checkpoints: [
    "security",
    "shield",
    "verified_user",
    "local_police",
    "warning",
  ],
  market: ["store", "shopping_cart", "local_grocery_store", "storefront"],
  security: ["security", "shield", "verified_user", "local_police", "warning"],
  fuel: ["local_gas_station", "local_fire_department", "oil_barrel"],
  health: [
    "local_hospital",
    "medical_services",
    "health_and_safety",
    "medication",
  ],
  restaurant: ["restaurant", "local_dining", "fastfood", "coffee"],
  hotel: ["hotel", "bed", "room_service", "ac_unit"],
  bank: ["account_balance", "savings", "credit_card", "atm"],
  school: ["school", "library_books", "menu_book", "science"],
  mosque: ["mosque", "place_of_worship", "temple_buddhist", "church"],
  general: ["place", "location_on", "pin_drop", "my_location", "near_me"],
} as const;
