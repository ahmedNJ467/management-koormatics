import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DisplayTrip } from "@/lib/types/trip";
import { useTripsData } from "@/hooks/use-trips-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/utils/activity-logger";
import { Vehicle } from "@/lib/types";
import { Shield, AlertTriangle, Car } from "lucide-react";
import { isVehicleAvailableForTimeSlot } from "@/lib/utils/availability-utils";

interface AssignEscortDialogProps {
  open: boolean;
  trip: DisplayTrip | null;
  onClose: () => void;
  onEscortAssigned: () => void;
}

export function AssignEscortDialog({
  open,
  trip,
  onClose,
  onEscortAssigned,
}: AssignEscortDialogProps) {
  const { vehicles = [], trips = [] } = useTripsData();
  const [selectedEscorts, setSelectedEscorts] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  console.log("AssignEscortDialog render:", {
    open,
    tripId: trip?.id,
    hasSecurityEscort: trip?.has_security_escort,
    escortCount: trip?.escort_count,
    vehiclesCount: vehicles?.length || 0,
    vehicles: vehicles,
  });

  const escortCount = trip?.escort_count || 1;
  const maxEscorts = Math.min(escortCount, 2); // Maximum 2 escorts

  useEffect(() => {
    if (trip && open) {
      // Initialize with empty escorts
      setSelectedEscorts(new Array(maxEscorts).fill(""));
    }
  }, [trip, open, maxEscorts]);

  // Filter available vehicles (exclude the main trip vehicle, already selected escorts, and vehicles assigned to other trips at conflicting times)
  const getAvailableVehicles = (currentIndex: number) => {
    const excludeIds = [
      trip?.vehicle_id, // Main trip vehicle
      ...selectedEscorts.filter((id, index) => index !== currentIndex && id), // Other selected escorts
    ].filter(Boolean);

    return (vehicles || []).filter((vehicle) => {
      if (excludeIds.includes(vehicle.id)) return false;
      // Time-based availability check
      if (!trip) return false;
      const availability = isVehicleAvailableForTimeSlot(
        vehicle.id,
        trip.date,
        trip.time || "00:00",
        trips,
        trip.return_time,
        trip.id,
        { bufferHours: 1 }
      );
      return availability.isAvailable;
    });
  };

  const mutation = useMutation({
    mutationFn: async ({
      tripId,
      escortVehicles,
    }: {
      tripId: string;
      escortVehicles: string[];
    }) => {
      // Store escort assignments in dedicated fields
      const validEscorts = escortVehicles.filter(Boolean);
      const escortCount = trip?.escort_count || 1;

      let escortStatus = "not_assigned";
      if (validEscorts.length === escortCount) {
        escortStatus = "fully_assigned";
      } else if (validEscorts.length > 0) {
        escortStatus = "partially_assigned";
      }

      const { error: tripError } = await supabase
        .from("trips")
        .update({
          escort_vehicle_ids: validEscorts as any,
          escort_status: escortStatus,
          escort_assigned_at: new Date().toISOString(),
        } as any)
        .eq("id", tripId as any);

      if (tripError) throw tripError;

      // Update vehicle availability status
      // First, clear any existing escort assignments for this trip
      const { error: clearError } = await supabase
        .from("vehicles")
        .update({
          is_escort_assigned: false,
          escort_trip_id: null,
          escort_assigned_at: null,
        } as any)
        .eq("escort_trip_id", tripId as any);

      if (clearError)
        console.warn("Error clearing old escort assignments:", clearError);

      // Then, assign the new escorts
      if (validEscorts.length > 0) {
        const { error: assignError } = await supabase
          .from("vehicles")
          .update({
            is_escort_assigned: true,
            escort_trip_id: tripId,
            escort_assigned_at: new Date().toISOString(),
          } as any)
          .in("id", validEscorts as any);

        if (assignError) throw assignError;
      }

      return { escortVehicles: validEscorts };
    },
    onSuccess: async ({ escortVehicles }) => {
      // Invalidate and refetch all related queries to ensure UI updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
        queryClient.refetchQueries({ queryKey: ["trips"] }),
        queryClient.refetchQueries({ queryKey: ["vehicles"] }),
      ]);

      // Small delay to ensure data propagates
      await new Promise((resolve) => setTimeout(resolve, 100));

      toast({
        title: "Escort Vehicles Assigned",
        description: `${escortVehicles.length} escort vehicle(s) have been assigned to the trip.`,
      });
      if (trip) {
        logActivity({
          title: `Security escorts assigned for trip ${trip.id}`,
          type: "trip",
          relatedId: trip.id.toString(),
        });
      }
      onEscortAssigned();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to assign escort vehicles: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    const validEscorts = selectedEscorts.filter(Boolean);
    if (validEscorts.length === 0) {
      toast({
        title: "No Escorts Selected",
        description: "Please select at least one escort vehicle.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({ tripId: trip.id, escortVehicles: validEscorts });
  };

  const updateEscort = (index: number, vehicleId: string) => {
    const newEscorts = [...selectedEscorts];
    newEscorts[index] = vehicleId;
    setSelectedEscorts(newEscorts);
  };

  if (!trip?.has_security_escort) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Assign Security Escorts
          </DialogTitle>
          <DialogDescription>
            Assign {maxEscorts} escort vehicle{maxEscorts > 1 ? "s" : ""} for
            trip {trip?.id ? trip.id.substring(0, 8).toUpperCase() : ""}.
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              High Security
            </Badge>
            <Badge variant="outline" className="text-xs">
              {maxEscorts} escort{maxEscorts > 1 ? "s" : ""} required
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Main Vehicle Info */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Main Vehicle:</span>
                <span>{trip.vehicle_details || "Not assigned"}</span>
              </div>
            </div>

            {/* Escort Vehicle Selectors */}
            {Array.from({ length: maxEscorts }, (_, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`escort-${index}`}>
                  Escort Vehicle {index + 1}
                  {index === 0 && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Select
                  onValueChange={(value) => updateEscort(index, value)}
                  value={selectedEscorts[index] || ""}
                >
                  <SelectTrigger id={`escort-${index}`}>
                    <SelectValue
                      placeholder={`Select escort vehicle ${index + 1}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableVehicles(index).length === 0 ? (
                      <SelectItem value="" disabled>
                        No available vehicles
                      </SelectItem>
                    ) : (
                      getAvailableVehicles(index).map((vehicle: Vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          <div className="flex items-center gap-2">
                            <span>
                              {vehicle.make} {vehicle.model} (
                              {vehicle.registration})
                            </span>
                            {vehicle.type && (
                              <Badge
                                variant={
                                  vehicle.type === "armoured"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {vehicle.type === "armoured"
                                  ? "Armoured"
                                  : "Soft Skin"}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Escort vehicles will follow the main vehicle and provide security
              coverage during the trip.
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedEscorts.some(Boolean) || mutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {mutation.isPending ? "Assigning..." : "Assign Escorts"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
