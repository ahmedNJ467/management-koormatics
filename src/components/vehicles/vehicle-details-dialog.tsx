
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Vehicle } from "@/lib/types";
import { formatVehicleId } from "@/lib/utils";
import { VehicleDetailsContent } from "./vehicle-details-content";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";
import { useQueryClient } from "@tanstack/react-query";

interface VehicleDetailsDialogProps {
  selectedVehicle: Vehicle | null;
  onClose: () => void;
  onDelete: () => void;
}

export function VehicleDetailsDialog({
  selectedVehicle,
  onClose,
  onDelete
}: VehicleDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedVehicle?.vehicle_images) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === selectedVehicle.vehicle_images.length - 1 ? 0 : prevIndex + 1
    );
  }, [selectedVehicle]);

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedVehicle?.vehicle_images) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? selectedVehicle.vehicle_images.length - 1 : prevIndex - 1
    );
  }, [selectedVehicle]);

  const selectThumbnail = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  const handleEditComplete = useCallback(() => {
    setViewMode("view");
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  }, [queryClient]);

  const handleClose = useCallback(() => {
    setViewMode("view");
    setCurrentImageIndex(0);
    onClose();
  }, [onClose]);

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const handleDeleteExecute = useCallback(() => {
    onDelete();
    setShowDeleteConfirm(false);
  }, [onDelete]);

  if (!selectedVehicle) return null;

  return (
    <>
      <Dialog open={!!selectedVehicle} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-10">
              Vehicle Details - {formatVehicleId(selectedVehicle.id)}
            </DialogTitle>
          </DialogHeader>

          {viewMode === "view" && (
            <VehicleDetailsContent 
              selectedVehicle={selectedVehicle}
              currentImageIndex={currentImageIndex}
              handlePrevImage={handlePrevImage}
              handleNextImage={handleNextImage}
              selectThumbnail={selectThumbnail}
              setViewMode={setViewMode}
              setShowDeleteConfirm={handleDeleteConfirm}
            />
          )}

          {viewMode === "edit" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="text-lg font-semibold">Edit Vehicle</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("view")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Edit
                </Button>
              </div>
              <VehicleFormDialog
                open={true}
                onOpenChange={(open) => {
                  if (!open) {
                    handleEditComplete();
                  }
                }}
                vehicle={selectedVehicle}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={handleDeleteCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this vehicle? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4 mt-4">
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteExecute}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
