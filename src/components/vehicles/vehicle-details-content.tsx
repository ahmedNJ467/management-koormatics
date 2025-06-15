
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Car, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Vehicle } from "@/lib/types";

interface VehicleDetailsContentProps {
  selectedVehicle: Vehicle;
  currentImageIndex: number;
  handlePrevImage: (e: React.MouseEvent) => void;
  handleNextImage: (e: React.MouseEvent) => void;
  selectThumbnail: (index: number) => void;
  setViewMode: (mode: "view" | "edit") => void;
  setShowDeleteConfirm: (show: boolean) => void;
}

export const VehicleDetailsContent = memo(({ 
  selectedVehicle, 
  currentImageIndex, 
  handlePrevImage, 
  handleNextImage, 
  selectThumbnail,
  setViewMode,
  setShowDeleteConfirm 
}: VehicleDetailsContentProps) => {
  const hasMultipleImages = selectedVehicle.vehicle_images && selectedVehicle.vehicle_images.length > 1;
  const currentImage = selectedVehicle.vehicle_images?.[currentImageIndex]?.image_url;

  return (
    <div className="space-y-6">
      {selectedVehicle.vehicle_images && selectedVehicle.vehicle_images.length > 0 ? (
        <div className="relative">
          <div className="w-full h-80 bg-muted rounded-lg overflow-hidden relative">
            {currentImage && (
              <img
                src={currentImage}
                alt={`Vehicle ${currentImageIndex + 1}`}
                className="w-full h-full object-contain rounded-lg"
              />
            )}
            
            {hasMultipleImages && (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          {selectedVehicle.vehicle_images.length > 1 && (
            <ScrollArea className="w-full h-24 mt-2">
              <div className="flex gap-2 p-1">
                {selectedVehicle.vehicle_images.map((image, index) => (
                  <div 
                    key={`thumb-${index}`}
                    className={`w-24 h-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${
                      currentImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => selectThumbnail(index)}
                  >
                    <img
                      src={image.image_url}
                      alt={`Vehicle thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-80 bg-muted rounded-lg">
          <Car className="h-16 w-16 text-muted-foreground" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Basic Information</h3>
          <div className="space-y-2">
            <p><span className="text-muted-foreground">Make:</span> {selectedVehicle.make}</p>
            <p><span className="text-muted-foreground">Model:</span> {selectedVehicle.model}</p>
            <p><span className="text-muted-foreground">Type:</span> {selectedVehicle.type.replace('_', ' ')}</p>
            <p><span className="text-muted-foreground">Registration:</span> {selectedVehicle.registration}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Additional Details</h3>
          <div className="space-y-2">
            <p><span className="text-muted-foreground">Year:</span> {selectedVehicle.year || 'N/A'}</p>
            <p><span className="text-muted-foreground">Color:</span> {selectedVehicle.color || 'N/A'}</p>
            <p><span className="text-muted-foreground">VIN:</span> {selectedVehicle.vin || 'N/A'}</p>
            <p><span className="text-muted-foreground">Insurance Expiry:</span> {selectedVehicle.insurance_expiry ? new Date(selectedVehicle.insurance_expiry).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>

      {selectedVehicle.notes && (
        <div>
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-muted-foreground">{selectedVehicle.notes}</p>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setViewMode("edit")}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
});

VehicleDetailsContent.displayName = "VehicleDetailsContent";
