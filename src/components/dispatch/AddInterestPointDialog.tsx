import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInterestPoints } from "@/hooks/use-interest-points";
import {
  CreateInterestPointData,
  INTEREST_POINT_CATEGORIES,
} from "@/lib/types/interest-point";
import { MapPin, X } from "lucide-react";
import { IconUpload } from "@/components/ui/icon-upload";

interface AddInterestPointDialogProps {
  open: boolean;
  onClose: () => void;
  initialCoordinates?: { lat: number; lng: number };
  onInterestPointAdded?: () => void;
}

export function AddInterestPointDialog({
  open,
  onClose,
  initialCoordinates,
  onInterestPointAdded,
}: AddInterestPointDialogProps) {
  const { createInterestPoint, isCreating } = useInterestPoints();
  const [formData, setFormData] = useState<CreateInterestPointData>({
    name: "",
    description: "",
    category: "general",
    latitude: 0,
    longitude: 0,
    icon_url: undefined,
  });

  useEffect(() => {
    if (initialCoordinates) {
      setFormData((prev) => ({
        ...prev,
        latitude: initialCoordinates.lat,
        longitude: initialCoordinates.lng,
      }));
    }
  }, [initialCoordinates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.name.trim()) {
      console.error("Interest point name is required");
      return;
    }

    if (formData.latitude === 0 && formData.longitude === 0) {
      console.error("Valid coordinates are required");
      return;
    }

    if (!formData.category) {
      console.error("Category is required");
      return;
    }

    if (!formData.icon_url) {
      console.error("Icon upload is required");
      return;
    }

    console.log("Submitting interest point form with data:", formData);

    try {
      await createInterestPoint(formData);
      setFormData({
        name: "",
        description: "",
        category: "general",
        latitude: 0,
        longitude: 0,
        icon_url: undefined,
      });
      onInterestPointAdded?.();
      onClose();
    } catch (error) {
      console.error("Error creating interest point:", error);
    }
  };

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      category: category as any,
    }));
  };

  const handleCoordinateChange = (
    field: "latitude" | "longitude",
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData((prev) => ({
        ...prev,
        [field]: numValue,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Add Interest Point
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                value={formData.latitude}
                onChange={(e) =>
                  handleCoordinateChange("latitude", e.target.value)
                }
                placeholder="e.g., 2.0469"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                value={formData.longitude}
                onChange={(e) =>
                  handleCoordinateChange("longitude", e.target.value)
                }
                placeholder="e.g., 45.3182"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter interest point name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {INTEREST_POINT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <IconUpload
            value={formData.icon_url}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, icon_url: url || undefined }))
            }
            disabled={isCreating}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isCreating || !formData.name.trim() || !formData.icon_url
              }
            >
              {isCreating ? "Adding..." : "Add Interest Point"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
