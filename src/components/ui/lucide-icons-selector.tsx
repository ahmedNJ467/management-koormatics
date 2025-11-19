import React, { useState, useMemo } from "react";
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
import { Search, Check } from "lucide-react";
import {
  getLucideIcon,
  ICON_CATEGORIES,
  type IconName,
} from "@/lib/utils/lucide-icon-mapping";
import { cn } from "@/lib/utils";

interface LucideIconsSelectorProps {
  value?: string;
  onChange: (iconName: string) => void;
  disabled?: boolean;
  className?: string;
}

// Popular icons that appear in all categories
const POPULAR_ICONS: IconName[] = [
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

export function LucideIconsSelector({
  value,
  onChange,
  disabled,
  className,
}: LucideIconsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredIcons = useMemo(() => {
    let icons: IconName[] = [];

    if (selectedCategory === "all") {
      // Combine all icons from all categories
      icons = Object.values(ICON_CATEGORIES).flat() as IconName[];
    } else if (selectedCategory === "popular") {
      icons = [...POPULAR_ICONS];
    } else if (ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES]) {
      icons = [...ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES]] as IconName[];
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

  const SelectedIcon = value ? getLucideIcon(value) : null;

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Icon</Label>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start"
          >
            {value && SelectedIcon ? (
              <div className="flex items-center gap-2">
                <SelectedIcon className="h-4 w-4" />
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
              Icons: {filteredIcons.length} found
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
              {Object.keys(ICON_CATEGORIES).map((category) => (
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
                {filteredIcons.map((iconName) => {
                  const IconComponent = getLucideIcon(iconName);
                  if (!IconComponent) return null;

                  return (
                    <Button
                      key={iconName}
                      variant={value === iconName ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleIconSelect(iconName)}
                      className="h-12 flex flex-col items-center justify-center p-1 relative hover:bg-muted/50"
                      title={iconName.replace(/_/g, " ")}
                    >
                      <IconComponent className="h-6 w-6 mb-1" />
                      {value === iconName && (
                        <Check className="h-3 w-3 absolute top-1 right-1 text-primary" />
                      )}
                    </Button>
                  );
                })}
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

      {value && SelectedIcon && (
        <div className="mt-2">
          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
            <SelectedIcon className="h-6 w-6" />
            <span className="text-sm text-muted-foreground capitalize">
              {value.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Select an icon from Lucide React icons (human-designed)
      </p>
    </div>
  );
}

