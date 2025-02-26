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
import { Plus, Car, Trash2, Edit, X } from "lucide-react";
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

export default function Vehicles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: "Vehicle deleted",
        description: "Vehicle has been successfully deleted",
      });
      setSelectedVehicle(null);
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
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      deleteMutation.mutate(id);
    }
  };

  const VehicleDetailsDialog = () => {
    if (!selectedVehicle) return null;

    return (
      <>
        <Dialog open={!!selectedVehicle} onOpenChange={() => {
          setSelectedVehicle(null);
          setViewMode("view");
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Vehicle Details - {formatVehicleId(selectedVehicle.id)}</span>
                <div className="flex gap-2">
                  {viewMode === "view" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode("edit")}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode("view")}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            {viewMode === "view" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedVehicle.vehicle_images?.map((image, index) => (
                    <img
                      key={index}
                      src={image.image_url}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Basic Information</h3>
                    <div className="space-y-2">
                      <p><span className="text-muted-foreground">Make:</span> {selectedVehicle.make}</p>
                      <p><span className="text-muted-foreground">Model:</span> {selectedVehicle.model}</p>
                      <p><span className="text-muted-foreground">Type:</span> {selectedVehicle.type}</p>
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
              </div>
            ) : (
              <VehicleFormDialog
                open={true}
                onOpenChange={() => {
                  setViewMode("view");
                  setSelectedVehicle(null);
                }}
                vehicle={selectedVehicle}
              />
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
                onClick={() => {
                  handleDelete(selectedVehicle.id);
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
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
        ) : (
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
              {vehicles?.map((vehicle) => (
                <TableRow 
                  key={vehicle.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <TableCell>{formatVehicleId(vehicle.id)}</TableCell>
                  <TableCell>
                    {vehicle.vehicle_images?.[0] ? (
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
