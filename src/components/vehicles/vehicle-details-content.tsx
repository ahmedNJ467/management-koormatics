import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car as CarIcon,
} from "lucide-react";
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

export const VehicleDetailsContent = memo(
  ({
    selectedVehicle,
    currentImageIndex,
    handlePrevImage,
    handleNextImage,
    selectThumbnail,
    setViewMode,
    setShowDeleteConfirm,
  }: VehicleDetailsContentProps) => {
    const hasMultipleImages =
      selectedVehicle.vehicle_images &&
      selectedVehicle.vehicle_images.length > 1;
    const currentImage =
      selectedVehicle.vehicle_images?.[currentImageIndex]?.image_url;

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "active":
          return <CheckCircle className="h-5 w-5 text-green-600" />;
        case "in_service":
          return <Clock className="h-5 w-5 text-blue-600" />;
        case "inactive":
          return <AlertTriangle className="h-5 w-5 text-orange-600" />;
        default:
          return <Car className="h-5 w-5 text-muted-foreground" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "active":
          return "bg-green-100 text-green-800 border-green-200";
        case "in_service":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "inactive":
          return "bg-orange-100 text-orange-800 border-orange-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    const getTypeIcon = (type: string) => {
      return type === "armoured" ? (
        <Shield className="h-5 w-5" />
      ) : (
        <CarIcon className="h-5 w-5" />
      );
    };

    const isInsuranceExpiringSoon = (expiryDate: string | null) => {
      if (!expiryDate) return false;
      const expiry = new Date(expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    const isInsuranceExpired = (expiryDate: string | null) => {
      if (!expiryDate) return false;
      const expiry = new Date(expiryDate);
      const now = new Date();
      return expiry < now;
    };

    return (
      <div className="space-y-6">
        {/* Header with Status */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {selectedVehicle.make} {selectedVehicle.model}
            </h2>
            <p className="text-muted-foreground font-mono">
              {selectedVehicle.registration}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getTypeIcon(selectedVehicle.type)}
              <Badge variant="outline" className="capitalize">
                {selectedVehicle.type.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(selectedVehicle.status)}
              <Badge
                variant="outline"
                className={`capitalize ${getStatusColor(
                  selectedVehicle.status
                )}`}
              >
                {selectedVehicle.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        {selectedVehicle.vehicle_images &&
        selectedVehicle.vehicle_images.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <div className="w-full aspect-video bg-white rounded-t-xl overflow-hidden relative border border-border shadow-sm flex items-center justify-center">
                  {currentImage && (
                    <img
                      src={currentImage}
                      alt={`Vehicle ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain rounded-t-xl transition-all duration-200"
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
                  <ScrollArea className="w-full h-24 border-t">
                    <div className="flex gap-2 p-2">
                      {selectedVehicle.vehicle_images.map((image, index) => (
                        <div
                          key={`thumb-${index}`}
                          className={`w-20 h-16 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${
                            currentImageIndex === index
                              ? "border-primary"
                              : "border-transparent"
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
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center w-full h-80 bg-muted rounded-lg">
              <Car className="h-16 w-16 text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {/* Vehicle Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Make
                  </label>
                  <p className="text-sm font-medium">{selectedVehicle.make}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Model
                  </label>
                  <p className="text-sm font-medium">{selectedVehicle.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Year
                  </label>
                  <p className="text-sm font-medium">
                    {selectedVehicle.year || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Color
                  </label>
                  <p className="text-sm font-medium">
                    {selectedVehicle.color || "N/A"}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Registration
                </label>
                <p className="text-sm font-mono font-medium">
                  {selectedVehicle.registration}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  VIN
                </label>
                <p className="text-sm font-mono font-medium">
                  {selectedVehicle.vin || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status & Insurance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status & Insurance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Current Status
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(selectedVehicle.status)}
                  <Badge
                    variant="outline"
                    className={`capitalize ${getStatusColor(
                      selectedVehicle.status
                    )}`}
                  >
                    {selectedVehicle.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Insurance Expiry
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {selectedVehicle.insurance_expiry ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isInsuranceExpired(selectedVehicle.insurance_expiry)
                            ? "text-red-600"
                            : isInsuranceExpiringSoon(
                                selectedVehicle.insurance_expiry
                              )
                            ? "text-orange-600"
                            : ""
                        }`}
                      >
                        {new Date(
                          selectedVehicle.insurance_expiry
                        ).toLocaleDateString()}
                      </span>
                      {(isInsuranceExpiringSoon(
                        selectedVehicle.insurance_expiry
                      ) ||
                        isInsuranceExpired(
                          selectedVehicle.insurance_expiry
                        )) && (
                        <Badge variant="destructive" className="text-xs">
                          {isInsuranceExpired(selectedVehicle.insurance_expiry)
                            ? "Expired"
                            : "Expiring Soon"}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not specified
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        {selectedVehicle.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedVehicle.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setViewMode("edit")}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Vehicle
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Vehicle
          </Button>
        </div>
      </div>
    );
  }
);

VehicleDetailsContent.displayName = "VehicleDetailsContent";
