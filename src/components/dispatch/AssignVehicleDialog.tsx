import { useState, useEffect, useMemo } from "react";
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
import { DisplayTrip } from "@/lib/types/trip";
import { useTripsData } from "@/hooks/use-trips-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/utils/activity-logger";
import { Vehicle } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { isVehicleAvailableForTimeSlot } from "@/lib/utils/availability-utils";

interface AssignVehicleDialogProps {
  open: boolean;
  trip: DisplayTrip | null;
  onClose: () => void;
  onVehicleAssigned: () => void;
}

interface EnhancedVehicle extends Vehicle {
  isAvailable: boolean;
  conflicts?: any[];
  reason?: string;
  isCompatible: boolean;
}

export function AssignVehicleDialog({
  open,
  trip,
  onClose,
  onVehicleAssigned,
}: AssignVehicleDialogProps) {
  const { vehicles = [], trips = [] } = useTripsData();
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const requirements = useMemo(() => {
    if (!trip) return [] as ("armoured"|"soft_skin")[];
    return [
      ...Array(trip.armoured_count || 0).fill("armoured" as const),
      ...Array(trip.soft_skin_count || 0).fill("soft_skin" as const),
    ];
  }, [trip]);

  useEffect(() => {
    if (!trip) return;
    const totalNeeded =
      (trip.soft_skin_count || 0) + (trip.armoured_count || 0);
    // Pre-fill with already assigned vehicles if array exists
    const preassigned =
      trip.assigned_vehicle_ids && trip.assigned_vehicle_ids.length > 0
        ? trip.assigned_vehicle_ids
        : trip.vehicle_id
        ? [trip.vehicle_id]
        : [];
    const initial = [...preassigned];
    while (initial.length < totalNeeded) initial.push("");
    setSelectedVehicles(initial.slice(0, totalNeeded));
    setConflictWarning(null);
  }, [trip]);

  // Check for conflicts when vehicle is selected
  useEffect(() => {
    if (trip) {
      let warning: string | null = null;
      selectedVehicles.filter(Boolean).forEach((vehId) => {
        const availability = isVehicleAvailableForTimeSlot(
          vehId,
          trip.date,
          trip.time || "00:00",
          trips,
          trip.return_time,
          trip.id,
          { bufferHours: 1 }
        );
        if (!availability.isAvailable && availability.conflicts.length > 0) {
          warning =
            warning ||
            `Some selected vehicles have conflicts (${availability.conflicts.length}).`;
        }
      });
      setConflictWarning(warning);
    } else {
      setConflictWarning(null);
    }
  }, [selectedVehicles, trip, trips]);

  const enhancedVehicles: EnhancedVehicle[] = vehicles.map((vehicle) => {
    if (!trip)
      return {
        ...vehicle,
        isAvailable: true,
        reason: undefined,
        isCompatible: true,
        conflicts: [],
      };

    // Check availability using time-based logic
    const availability = isVehicleAvailableForTimeSlot(
      vehicle.id,
      trip.date,
      trip.time || "00:00",
      trips,
      trip.return_time,
      trip.id,
      { bufferHours: 1 }
    );

    // Check if vehicle type matches trip requirement
    const isCompatible =
      !trip.vehicle_type || vehicle.type === trip.vehicle_type;

    return {
      ...vehicle,
      isAvailable: availability.isAvailable,
      conflicts: availability.conflicts,
      reason: availability.reason,
      isCompatible,
    };
  });

  const getAvailableVehicles = (currentIndex: number) => {
    const excludeIds = selectedVehicles.filter((id, idx) => idx !== currentIndex && id);
    const requiredType = requirements[currentIndex];
    return enhancedVehicles.filter(
      (v) =>
        !excludeIds.includes(v.id) &&
        v.isCompatible &&
        (!requiredType || v.type === requiredType)
    );
  };

  const mutation = useMutation({
    mutationFn: async ({
      tripId,
      vehicleIds,
    }: {
      tripId: string;
      vehicleIds: string[];
    }) => {
      const { error } = await supabase
        .from("trips")
        .update({
          vehicle_id: vehicleIds[0], // Assuming the first selected vehicle is the primary one
          assigned_vehicle_ids: vehicleIds,
        })
        .eq("id", tripId);

      if (error) throw error;
    },
    onSuccess: async () => {
      // Force immediate refresh of all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
        queryClient.invalidateQueries({ queryKey: ["drivers"] }),
      ]);

      // Also refetch immediately to ensure fresh data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["trips"] }),
        queryClient.refetchQueries({ queryKey: ["vehicles"] }),
      ]);

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
    if (!trip || selectedVehicles.length === 0) return;
    mutation.mutate({
      tripId: trip.id,
      vehicleIds: selectedVehicles.filter(Boolean),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Vehicle</DialogTitle>
          <DialogDescription>
            Assign a vehicle for trip{" "}
            {trip?.id ? trip.id.substring(0, 8).toUpperCase() : ""}.
          </DialogDescription>
          {trip?.vehicle_type && (
            <div className="mt-2 text-sm text-muted-foreground">
              Required type:{" "}
              <Badge variant="outline" className="ml-1">
                {trip.vehicle_type.replace("_", " ")}
              </Badge>
            </div>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {selectedVehicles.map((val, idx) => (
              <div key={idx} className="space-y-2">
                <Label htmlFor={`vehicle-${idx}`}>
                  Vehicle {idx + 1} – {requirements[idx]?.replace("_", " ") || "any"} ({enhancedVehicles.length} total)
                </Label>
                <Select
                  onValueChange={(value) => {
                    const newSelectedVehicles = [...selectedVehicles];
                    newSelectedVehicles[idx] = value;
                    setSelectedVehicles(newSelectedVehicles);
                  }}
                  value={val}
                >
                  <SelectTrigger id={`vehicle-${idx}`}>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableVehicles(idx)
                      .filter((vehicle) => vehicle.isCompatible)
                      .map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {vehicle.make} {vehicle.model} (
                              {vehicle.registration})
                            </span>
                            <div className="flex gap-1">
                              <Badge
                                className={`${
                                  vehicle.isAvailable
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-amber-500 hover:bg-amber-600"
                                } text-white text-xs`}
                              >
                                {vehicle.isAvailable ? "Available" : "Busy"}
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {conflictWarning && (
              <div className="bg-amber-900/30 border border-amber-500/50 text-amber-200 p-3 rounded-md flex items-start gap-2">
                <div className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0">
                  ⚠️
                </div>
                <p className="text-sm">{conflictWarning}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={selectedVehicles.filter(Boolean).length !== requirements.length || mutation.isPending}
            >
              {mutation.isPending ? "Assigning..." : "Assign Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
