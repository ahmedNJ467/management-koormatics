import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Check } from "lucide-react";
import {
  getGoogleIconUrl,
  handleImageError,
  getThemeAwareIconStyle,
} from "@/lib/utils/google-icons";

interface GoogleIconsSelectorProps {
  value?: string;
  onChange: (iconName: string) => void;
  disabled?: boolean;
  className?: string;
}

// Predefined icon sets for different categories
const ICON_SETS = {
  places: [
    "place",
    "location_on",
    "location_city",
    "home",
    "business",
    "store",
    "restaurant",
    "hotel",
    "local_gas_station",
    "local_hospital",
    "school",
    "account_balance",
    "local_police",
    "park",
    "beach_access",
    "terrain",
  ],
  checkpoints: [
    "security",
    "shield",
    "verified_user",
    "gavel",
    "local_police",
    "warning",
    "check_circle",
    "verified",
    "lock",
    "lock_outline",
    "security",
  ],
  market: [
    "store",
    "shopping_cart",
    "local_grocery_store",
    "storefront",
    "shopping_bag",
    "local_mall",
    "inventory",
    "warehouse",
    "local_shipping",
  ],
  security: [
    "security",
    "shield",
    "verified_user",
    "gavel",
    "local_police",
    "warning",
    "check_circle",
    "verified",
    "lock",
    "lock_outline",
  ],
  fuel: [
    "local_gas_station",
    "local_fire_department",
    "oil_barrel",
    "fuel",
    "gas_station",
  ],
  health: [
    "local_hospital",
    "medical_services",
    "health_and_safety",
    "medication",
    "local_pharmacy",
    "emergency",
    "healing",
    "vaccines",
  ],
  restaurant: [
    "restaurant",
    "local_dining",
    "fastfood",
    "coffee",
    "local_cafe",
    "bakery_dining",
    "local_pizza",
    "ramen_dining",
    "icecream",
  ],
  hotel: [
    "hotel",
    "bed",
    "room_service",
    "ac_unit",
    "pool",
    "wifi",
    "restaurant_menu",
  ],
  bank: [
    "account_balance",
    "savings",
    "credit_card",
    "atm",
    "account_balance_wallet",
    "monetization_on",
    "attach_money",
    "local_atm",
  ],
  school: [
    "school",
    "library_books",
    "menu_book",
    "science",
    "computer",
    "sports_soccer",
    "music_note",
    "palette",
    "psychology",
  ],
  mosque: [
    "mosque",
    "place_of_worship",
    "temple_buddhist",
    "church",
    "synagogue",
    "spa",
    "self_improvement",
    "nature_people",
  ],
  general: [
    "place",
    "location_on",
    "pin_drop",
    "my_location",
    "near_me",
    "room",
    "explore",
    "map",
    "navigation",
    "directions",
  ],
};

// Popular icons that appear in all categories
const POPULAR_ICONS = [
  "place",
  "location_on",
  "pin_drop",
  "my_location",
  "near_me",
  "room",
  "explore",
  "map",
  "navigation",
  "directions",
  "star",
  "favorite",
  "bookmark",
  "flag",
  "marker",
  "push_pin",
];

export function GoogleIconsSelector({
  value,
  onChange,
  disabled,
  className,
}: GoogleIconsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDark, setIsDark] = useState(false);

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === "undefined" || typeof document === "undefined") {
          setIsDark(false);
          return;
        }

        // Check for dark class on html element
        const hasDarkClass =
          document.documentElement.classList.contains("dark");

        // Check for system preference
        const prefersDark =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;

        // Check for data-theme attribute
        const dataTheme = document.documentElement.getAttribute("data-theme");
        const isDataThemeDark = dataTheme === "dark";

        // Check for Tailwind's dark mode class
        const hasTailwindDark =
          document.documentElement.classList.contains("dark");

        const isDarkMode =
          hasDarkClass || prefersDark || isDataThemeDark || hasTailwindDark;

        console.log("Theme detection:", {
          hasDarkClass,
          prefersDark,
          isDataThemeDark,
          hasTailwindDark,
          isDarkMode,
        });

        setIsDark(isDarkMode);
      } catch (error) {
        console.warn("Error checking theme:", error);
        setIsDark(false); // Default to light mode on error
      }
    };

    checkTheme();

    // Listen for theme changes
    try {
      const observer = new MutationObserver(checkTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });

      if (typeof window !== "undefined" && window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", checkTheme);

        return () => {
          observer.disconnect();
          mediaQuery.removeEventListener("change", checkTheme);
        };
      }

      return () => {
        observer.disconnect();
      };
    } catch (error) {
      console.warn("Error setting up theme listeners:", error);
      return () => {}; // No cleanup needed if setup failed
    }
  }, []);

  const filteredIcons = useMemo(() => {
    let icons: string[] = [];

    if (selectedCategory === "all") {
      // Combine all icons from all categories
      icons = Object.values(ICON_SETS).flat();
    } else if (selectedCategory === "popular") {
      icons = POPULAR_ICONS;
    } else if (ICON_SETS[selectedCategory as keyof typeof ICON_SETS]) {
      icons = ICON_SETS[selectedCategory as keyof typeof ICON_SETS];
    }

    // Remove duplicates
    icons = [...new Set(icons)];

    // Filter by search query
    if (searchQuery.trim()) {
      icons = icons.filter((icon) =>
        icon.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return icons;
  }, [selectedCategory, searchQuery]);

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
  };

  const getIconUrl = (iconName: string) => {
    return getGoogleIconUrl(iconName);
  };

  const getIconStyle = (color?: string) => {
    return getThemeAwareIconStyle(isDark, color);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Icon</Label>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start"
          >
            {value ? (
              <div className="flex items-center gap-2">
                <img
                  src={getIconUrl(value)}
                  alt={value}
                  className="h-4 w-4"
                  style={getIconStyle()}
                  onError={(e) => handleImageError(e)}
                />
                <span className="capitalize">{value.replace(/_/g, " ")}</span>
              </div>
            ) : (
              "Select Icon"
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Icon</DialogTitle>
            <div className="text-xs text-muted-foreground">
              Theme: {isDark ? "Dark" : "Light"} | Icons: {filteredIcons.length}{" "}
              found
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              <Button
                variant={selectedCategory === "popular" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("popular")}
              >
                Popular
              </Button>
              {Object.keys(ICON_SETS).map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Icons Grid */}
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {filteredIcons.map((iconName) => (
                  <Button
                    key={iconName}
                    variant={value === iconName ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleIconSelect(iconName)}
                    className="h-12 flex flex-col items-center justify-center p-1 relative hover:bg-muted/50"
                    title={iconName.replace(/_/g, " ")}
                  >
                    <img
                      src={getIconUrl(iconName)}
                      alt={iconName}
                      className="h-6 w-6 mb-1"
                      style={getIconStyle()}
                      onError={(e) => handleImageError(e)}
                    />
                    {value === iconName && (
                      <Check className="h-3 w-3 absolute top-1 right-1 text-primary" />
                    )}
                  </Button>
                ))}
              </div>

              {filteredIcons.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No icons found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {value && (
        <div className="mt-2">
          <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
            <img
              src={getIconUrl(value)}
              alt={value}
              className="h-6 w-6"
              style={getIconStyle()}
              onError={(e) => handleImageError(e)}
            />
            <span className="text-sm text-gray-600 capitalize">
              {value.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Select an icon from Google Material Icons
      </p>
    </div>
  );
}
