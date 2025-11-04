import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SparePart } from "../types";
import { Edit, Trash2, Package, DollarSign, MapPin, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPublicImageUrl } from "../utils/upload-utils";

interface PartDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  part: SparePart | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const PartDetailsDialog = ({
  isOpen,
  onOpenChange,
  part,
  onEdit,
  onDelete,
}: PartDetailsDialogProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Load image URL when part changes
  useEffect(() => {
    if (part?.part_image) {
      setIsLoadingImage(true);
      setImageError(false);
      
      // Check if part_image is already a full URL
      if (part.part_image.startsWith("http://") || part.part_image.startsWith("https://")) {
        setImageUrl(part.part_image);
        setIsLoadingImage(false);
      } else {
        // It's a storage path, convert to public URL
        getPublicImageUrl(part.part_image)
          .then((url) => {
            if (url) {
              setImageUrl(url);
            } else {
              // If getPublicImageUrl fails, try direct Supabase URL
              const { data } = supabase.storage
                .from("images")
                .getPublicUrl(part.part_image);
              setImageUrl(data?.publicUrl || null);
            }
            setIsLoadingImage(false);
          })
          .catch((error) => {
            console.error("Error loading image URL:", error);
            // Fallback: try direct Supabase URL
            try {
              const { data } = supabase.storage
                .from("images")
                .getPublicUrl(part.part_image);
              setImageUrl(data?.publicUrl || null);
            } catch (e) {
              setImageUrl(null);
            }
            setIsLoadingImage(false);
          });
      }
    } else {
      setImageUrl(null);
      setIsLoadingImage(false);
    }
  }, [part?.part_image]);

  if (!part) return null;

  const getStockStatus = () => {
    if (part.quantity <= 0) {
      return {
        label: "Out of Stock",
        variant: "destructive" as const,
        color: "text-red-600 dark:text-red-400",
      };
    }
    if (part.quantity <= part.min_stock_level) {
      return {
        label: "Low Stock",
        variant: "secondary" as const,
        color: "text-yellow-600 dark:text-yellow-400",
      };
    }
    return {
      label: "In Stock",
      variant: "default" as const,
      color: "text-green-600 dark:text-green-400",
    };
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-10">{part.name}</DialogTitle>
          <DialogDescription>
            Part Number: {part.part_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Part Image */}
          {part.part_image && (
            <div className="flex justify-center">
              {isLoadingImage ? (
                <div className="w-full h-48 flex items-center justify-center bg-muted rounded-lg border">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={part.name}
                  className="max-w-full h-48 object-contain rounded-lg border"
                  onError={() => {
                    setImageError(true);
                  }}
                  onLoad={() => {
                    setImageError(false);
                  }}
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-muted rounded-lg border text-muted-foreground">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{part.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span className="font-medium">Category</span>
              </div>
              <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                {part.category}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Manufacturer</span>
              </div>
              <p className="text-sm">{part.manufacturer}</p>
            </div>
          </div>

          {/* Inventory Information */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Quantity</span>
              </div>
              <p className="text-lg font-semibold">{part.quantity}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Unit Price</span>
              </div>
              <p className="text-lg font-semibold">${part.unit_price.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Stock Status</span>
              </div>
              <Badge variant={stockStatus.variant} className={stockStatus.color}>
                {stockStatus.label}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Minimum Stock Level</span>
              </div>
              <p className="text-sm">{part.min_stock_level}</p>
            </div>
          </div>

          {/* Location and Dates */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Location</span>
              </div>
              <p className="text-sm">{part.location}</p>
            </div>

            {part.purchase_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Purchase Date</span>
                </div>
                <p className="text-sm">
                  {format(new Date(part.purchase_date), "MMM dd, yyyy")}
                </p>
              </div>
            )}

            {part.last_ordered && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Last Ordered</span>
                </div>
                <p className="text-sm">
                  {format(new Date(part.last_ordered), "MMM dd, yyyy")}
                </p>
              </div>
            )}

            {part.last_used_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Last Used</span>
                </div>
                <p className="text-sm">
                  {format(new Date(part.last_used_date), "MMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>

          {/* Compatibility */}
          {part.compatibility && part.compatibility.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="font-medium">Compatibility</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {part.compatibility.map((item, index) => (
                  <Badge key={index} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {part.notes && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Notes</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{part.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

