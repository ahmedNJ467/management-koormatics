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
  // Add this new prop
  isEditMode?: boolean; // Indicates if in edit mode (to pre-populate assigned vehicles)
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
  isEditMode = false, // Default to false
}: AssignVehicleDialogProps) {
  const { vehicles = [], trips = [] } = useTripsData();
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const requirements = useMemo(() => {
    if (!trip) return [] as ("armoured" | "soft_skin")[];
    return [
      ...Array(trip.armoured_count || 0).fill("armoured" as const),
      ...Array(trip.soft_skin_count || 0).fill("soft_skin" as const),
    ];
  }, [trip]);

  useEffect(() => {
    if (!trip || !open) return;

    const newSelectedVehicles: string[] = [];

    // Populate initial selections based on existing assigned_vehicle_ids
    if (
      isEditMode &&
      trip.assigned_vehicle_ids &&
      trip.assigned_vehicle_ids.length > 0
    ) {
      trip.assigned_vehicle_ids.forEach((id) => newSelectedVehicles.push(id));
    }

    // Pad with empty strings if not enough vehicles are pre-selected to meet requirements
    while (newSelectedVehicles.length < requirements.length) {
      newSelectedVehicles.push("");
    }

    // Trim if too many were pre-selected for the current requirements
    setSelectedVehicles(newSelectedVehicles.slice(0, requirements.length));
    setConflictWarning(null);
  }, [trip, open, requirements, isEditMode]);

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
    const excludeIds = selectedVehicles.filter(
      (id, idx) => idx !== currentIndex && id
    );
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
      // Optimistically update trips cache so UI reflects vehicles + driver status in sync
      queryClient.setQueryData<DisplayTrip[] | undefined>(
        ["trips"],
        (prev: any) => {
          if (!prev) return prev as any;
          if (!trip) return prev;
          const validVehicles = selectedVehicles.filter(Boolean);
          return prev.map((t: any) =>
            t.id === trip.id
              ? {
                  ...t,
                  vehicle_id: validVehicles[0] || t.vehicle_id,
                  assigned_vehicle_ids: validVehicles,
                }
              : t
          );
        }
      );

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
    if (!trip) return;

    const validVehicles = selectedVehicles.filter(Boolean); // Filter out empty strings

    // Validation: ensure all required slots are filled
    if (validVehicles.length !== requirements.length) {
      toast({
        title: "Assignment Incomplete",
        description: `Please assign ${
          requirements.length - validVehicles.length
        } more vehicle(s).`,
        variant: "destructive",
      });
      return;
    }

    // Ensure no duplicate vehicles are selected (excluding empty slots)
    const uniqueVehicles = new Set(validVehicles);
    if (uniqueVehicles.size !== validVehicles.length) {
      toast({
        title: "Duplicate Vehicles",
        description: "Please ensure each selected vehicle is unique.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({ tripId: trip.id, vehicleIds: validVehicles });
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
          <DialogTitle>Assign Vehicles</DialogTitle>
          <DialogDescription>
            Assign required vehicles for trip{" "}
            {trip?.id ? trip.id.substring(0, 8).toUpperCase() : ""}. This trip
            requires:
            <ul className="list-disc list-inside mt-2">
              {trip?.soft_skin_count > 0 && (
                <li>
                  <Badge variant="secondary" className="mr-1">
                    {trip.soft_skin_count}
                  </Badge>
                  Soft Skin vehicle(s)
                </li>
              )}
              {trip?.armoured_count > 0 && (
                <li>
                  <Badge variant="default" className="mr-1">
                    {trip.armoured_count}
                  </Badge>
                  Armoured vehicle(s)
                </li>
              )}
              {requirements.length === 0 && (
                <li>No specific vehicle types requested.</li>
              )}
            </ul>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {requirements.length === 0 && (
              <p className="text-muted-foreground">
                No specific vehicle types were requested for this trip.
              </p>
            )}
            {requirements.map((requiredType, idx) => (
              <div key={idx} className="space-y-2">
                <Label htmlFor={`vehicle-${idx}`}>
                  Vehicle {idx + 1} – {requiredType.replace("_", " ")} (
                  {getAvailableVehicles(idx).length} available)
                </Label>
                <Select
                  onValueChange={(value) => {
                    const newSelectedVehicles = [...selectedVehicles];
                    newSelectedVehicles[idx] = value;
                    setSelectedVehicles(newSelectedVehicles);
                  }}
                  value={selectedVehicles[idx] || ""} // Ensure value is a string, not undefined
                >
                  <SelectTrigger id={`vehicle-${idx}`}>
                    <SelectValue
                      placeholder={`Select ${requiredType.replace(
                        "_",
                        " "
                      )} vehicle`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableVehicles(idx).map((vehicle) => (
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
                            <Badge variant="outline" className="text-xs">
                              {vehicle.type === "armoured"
                                ? "Armoured"
                                : "Soft Skin"}
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
              disabled={
                selectedVehicles.filter(Boolean).length !==
                  requirements.length || mutation.isPending
              }
            >
              {mutation.isPending ? "Assigning..." : "Assign Vehicles"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
