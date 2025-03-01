import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Car, Trash2, Edit, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Vehicle } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatVehicleId } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Vehicles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*, vehicle_images(image_url)')
        .order('created_at', { ascending: false });
      
      if (vehiclesError) {
        toast({
          title: "Error fetching vehicles",
          description: vehiclesError.message,
          variant: "destructive",
        });
        throw vehiclesError;
      }
      
      return vehiclesData as (Vehicle & { vehicle_images: { image_url: string }[] })[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Vehicle deleted",
        description: "Vehicle has been successfully deleted",
      });
      setSelectedVehicle(null);
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const closeVehicleDetails = () => {
    setSelectedVehicle(null);
    setViewMode("view");
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    if (!selectedVehicle?.vehicle_images) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === selectedVehicle.vehicle_images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevImage = () => {
    if (!selectedVehicle?.vehicle_images) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? selectedVehicle.vehicle_images.length - 1 : prevIndex - 1
    );
  };

  const VehicleDetailsDialog = () => {
    if (!selectedVehicle) return null;
    
    const hasMultipleImages = selectedVehicle.vehicle_images && selectedVehicle.vehicle_images.length > 1;

    return (
      <>
        <Dialog open={!!selectedVehicle} onOpenChange={closeVehicleDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="pr-10">
                Vehicle Details - {formatVehicleId(selectedVehicle.id)}
              </DialogTitle>
            </DialogHeader>

            {viewMode === "view" ? (
              <div className="space-y-6">
                {selectedVehicle.vehicle_images && selectedVehicle.vehicle_images.length > 0 ? (
                  <div className="relative">
                    <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden relative">
                      <img
                        src={selectedVehicle.vehicle_images[currentImageIndex].image_url}
                        alt={`Vehicle ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        key={`main-image-${currentImageIndex}`}
                      />
                      
                      {hasMultipleImages && (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevImage();
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextImage();
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {selectedVehicle.vehicle_images.length > 3 && (
                      <ScrollArea className="w-full h-24 mt-2">
                        <div className="flex gap-2 p-1">
                          {selectedVehicle.vehicle_images.map((image, index) => (
                            <div 
                              key={index} 
                              className={`w-24 h-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${
                                currentImageIndex === index ? 'border-primary' : 'border-transparent'
                              }`}
                              onClick={() => setCurrentImageIndex(index)}
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
                  <div className="flex items-center justify-center w-full h-48 bg-muted rounded-lg">
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
            ) : (
              <div className="space-y-6">
                <VehicleFormDialog
                  open={true}
                  onOpenChange={() => {
                    setViewMode("view");
                  }}
                  vehicle={selectedVehicle}
                />
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode("view")}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Vehicle</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this vehicle? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-4 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDelete(selectedVehicle.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">Manage your fleet vehicles</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Car className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8 text-destructive">
            Failed to load vehicles
          </div>
        ) : vehicles && vehicles.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Make & Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Insurance Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow 
                  key={vehicle.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <TableCell>{formatVehicleId(vehicle.id)}</TableCell>
                  <TableCell>
                    {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 ? (
                      <img
                        src={vehicle.vehicle_images[0].image_url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    ) : (
                      <Car className="h-24 w-24 p-2 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{vehicle.type.replace('_', ' ')}</TableCell>
                  <TableCell>{`${vehicle.make} ${vehicle.model}`}</TableCell>
                  <TableCell className="capitalize">{vehicle.status.replace('_', ' ')}</TableCell>
                  <TableCell>{vehicle.registration}</TableCell>
                  <TableCell>
                    {vehicle.insurance_expiry 
                      ? new Date(vehicle.insurance_expiry).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Car className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No vehicles found</h3>
            <p className="text-muted-foreground mb-4">Add your first vehicle to get started.</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle
            </Button>
          </div>
        )}
      </div>

      <VehicleFormDialog 
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <VehicleDetailsDialog />
    </div>
  );
}
