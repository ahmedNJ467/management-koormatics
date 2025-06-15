
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DisplayTrip } from "@/lib/types/trip";
import { useTripsData } from "@/hooks/use-trips-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/utils/activity-logger";
import { Vehicle } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface AssignVehicleDialogProps {
  open: boolean;
  trip: DisplayTrip | null;
  onClose: () => void;
  onVehicleAssigned: () => void;
}

export function AssignVehicleDialog({ open, trip, onClose, onVehicleAssigned }: AssignVehicleDialogProps) {
  const { vehicles = [] } = useTripsData();
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (trip?.vehicle_id) {
      setSelectedVehicle(trip.vehicle_id);
    } else {
      setSelectedVehicle("");
    }
  }, [trip]);

  const filteredVehicles = vehicles.filter(vehicle => {
    if (!trip || !trip.vehicle_type) {
      return true;
    }
    return vehicle.type === trip.vehicle_type;
  });

  const mutation = useMutation({
    mutationFn: async ({ tripId, vehicleId }: { tripId: string, vehicleId: string }) => {
      const { error } = await supabase
        .from("trips")
        .update({ vehicle_id: vehicleId })
        .eq("id", tripId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast({
        title: "Vehicle Assigned",
        description: "The vehicle has been successfully assigned to the trip.",
      });
      if (trip) {
        logActivity({
          title: `Vehicle assigned for trip ${trip.id}`,
          type: "trip",
          relatedId: trip.id.toString(),
        });
      }
      onVehicleAssigned();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to assign vehicle: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !selectedVehicle) return;
    mutation.mutate({ tripId: trip.id, vehicleId: selectedVehicle });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Vehicle</DialogTitle>
          <DialogDescription>
            Assign a vehicle for trip {trip?.id ? trip.id.substring(0, 8).toUpperCase() : ''}.
            {trip?.vehicle_type && <span className="block mt-1 capitalize">Required type: <Badge variant="outline">{trip.vehicle_type.replace('_', ' ')}</Badge></span>}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle</Label>
              <Select onValueChange={setSelectedVehicle} value={selectedVehicle}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVehicles.map((vehicle: Vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.registration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!selectedVehicle || mutation.isPending}>
              {mutation.isPending ? "Assigning..." : "Assign Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
