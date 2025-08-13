import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useTripsData } from "@/hooks/use-trips-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DisplayTrip } from "@/lib/types/trip";
import { Driver } from "@/lib/types";
import { Vehicle } from "@/lib/types/vehicle";
import {
  isDriverAvailableForTimeSlot,
  isVehicleAvailableForTimeSlot,
} from "@/lib/utils/availability-utils";

interface AssignResourcesDialogProps {
  open: boolean;
  trip: DisplayTrip | null;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignResourcesDialog({
  open,
  trip,
  onClose,
  onAssigned,
}: AssignResourcesDialogProps) {
  const { drivers = [], vehicles = [], trips = [] } = useTripsData();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [carrierDriverIds, setCarrierDriverIds] = useState<string[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedEscorts, setSelectedEscorts] = useState<string[]>([]);
  const [escortDriverIds, setEscortDriverIds] = useState<string[]>([]);

  // Determine vehicle requirements from trip
  const requirements = useMemo(() => {
    if (!trip) return [] as ("armoured" | "soft_skin")[];
    return [
      ...Array(trip.armoured_count || 0).fill("armoured" as const),
      ...Array(trip.soft_skin_count || 0).fill("soft_skin" as const),
    ];
  }, [trip]);

  // Escort count
  const maxEscorts = useMemo(
    () => (trip?.escort_count ? Math.min(trip.escort_count, 2) : 0),
    [trip]
  );

  useEffect(() => {
    if (!open || !trip) return;
    // Pre-populate carrier drivers from assignments if available, else fallback to trip.driver_id
    const carrierDrivers: string[] = [];
    const fromAssignments = (trip as any).assigned_driver_ids as
      | string[]
      | undefined;
    if (Array.isArray(fromAssignments) && fromAssignments.length > 0) {
      carrierDrivers.push(...fromAssignments);
    } else if (trip.driver_id) {
      carrierDrivers.push(trip.driver_id);
    }
    while (carrierDrivers.length < requirements.length) carrierDrivers.push("");
    setCarrierDriverIds(carrierDrivers.slice(0, requirements.length));

    // Pre-populate vehicles
    const presetVehicles: string[] = [];
    if (
      Array.isArray(trip.assigned_vehicle_ids) &&
      trip.assigned_vehicle_ids.length > 0
    ) {
      presetVehicles.push(...trip.assigned_vehicle_ids);
    }
    while (presetVehicles.length < requirements.length) presetVehicles.push("");
    let initialVehicles = presetVehicles.slice(0, requirements.length);

    // Pre-populate escorts
    const presetEscorts: string[] = [];
    if (Array.isArray(trip.escort_vehicle_ids))
      presetEscorts.push(...trip.escort_vehicle_ids);
    while (presetEscorts.length < maxEscorts) presetEscorts.push("");
    let initialEscorts = presetEscorts.slice(0, maxEscorts);

    // De-duplicate between carrier and escort on open (carrier takes precedence)
    const carrierSet = new Set(initialVehicles.filter(Boolean));
    initialEscorts = initialEscorts.map((v) =>
      v && carrierSet.has(v) ? "" : v
    );

    setSelectedVehicles(initialVehicles);
    setSelectedEscorts(initialEscorts);
    setEscortDriverIds(new Array(maxEscorts).fill(""));
  }, [open, trip, requirements, maxEscorts]);

  // Availability-filtered lists
  const availableDrivers = (excludeIds: string[] = []) =>
    (drivers as Driver[]).filter((d) => {
      if (excludeIds.includes(d.id)) return false;
      if (!trip) return true;
      const a = isDriverAvailableForTimeSlot(
        d.id,
        trip.date,
        trip.time || "00:00",
        trips,
        trip.return_time,
        trip.id,
        { bufferHours: 0 }
      );
      return a.isAvailable;
    });

  const availableVehicles = (
    requiredType?: "armoured" | "soft_skin",
    exclude: string[] = []
  ) =>
    (vehicles as Vehicle[]).filter((v) => {
      if (exclude.includes(v.id)) return false;
      if (requiredType && v.type !== requiredType) return false;
      if (!trip) return true;
      const a = isVehicleAvailableForTimeSlot(
        v.id,
        trip.date,
        trip.time || "00:00",
        trips,
        trip.return_time,
        trip.id,
        { bufferHours: 0 }
      );
      return a.isAvailable;
    });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!trip) return;

      // Validate vehicles
      const mainVehicles = selectedVehicles.filter(Boolean);
      if (mainVehicles.length !== requirements.length) {
        throw new Error("Please assign all required vehicles for the trip.");
      }

      // Update trip with primary driver/vehicle, all vehicles, and escorts
      const { error: tripError } = await supabase
        .from("trips")
        .update({
          driver_id: carrierDriverIds[0] || null,
          vehicle_id: mainVehicles[0] || null,
          assigned_vehicle_ids: mainVehicles,
          escort_vehicle_ids: selectedEscorts.filter(Boolean),
        })
        .eq("id", trip.id);
      if (tripError) throw tripError;

      // Insert assignment records for main + escort drivers (optional)
      const assignments: any[] = [];
      carrierDriverIds.forEach((driverId) => {
        if (driverId) {
          assignments.push({
            trip_id: trip.id,
            driver_id: driverId,
            status: "pending",
          });
        }
      });
      escortDriverIds.forEach((driverId, idx) => {
        if (driverId) {
          assignments.push({
            trip_id: trip.id,
            driver_id: driverId,
            status: "pending",
          });
        }
      });
      if (assignments.length > 0) {
        const { error: assignError } = await supabase
          .from("trip_assignments")
          .insert(assignments);
        if (assignError) throw assignError;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
        queryClient.invalidateQueries({ queryKey: ["drivers"] }),
      ]);
      toast({
        title: "Resources assigned",
        description: "Driver(s) and vehicle(s) assigned.",
      });
      onAssigned();
      onClose();
    },
    onError: (e: any) => {
      toast({
        title: "Assignment failed",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Resources</DialogTitle>
          <DialogDescription>
            Trip {trip.id.substring(0, 8).toUpperCase()} • {trip.date}{" "}
            {trip.time}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Main vehicles and drivers */}
          <div className="space-y-3">
            <Label>Main vehicles and drivers</Label>
            {requirements.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No specific vehicle types requested.
              </div>
            )}
            {requirements.map((type, idx) => {
              // Exclude vehicles already chosen in other carrier slots and ALL escort slots
              const exclude = [
                ...selectedVehicles.filter(
                  (_, i) => i !== idx && selectedVehicles[i]
                ),
                ...selectedEscorts,
              ].filter(Boolean) as string[];
              const avail = availableVehicles(type, exclude as string[]);
              const driverExclude = [
                ...carrierDriverIds.filter(
                  (_, i) => i !== idx && carrierDriverIds[i]
                ),
                ...escortDriverIds,
              ].filter(Boolean) as string[];
              const driversAvail = availableDrivers(driverExclude);
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Vehicle {idx + 1} – {type.replace("_", " ")} (
                      {avail.length} available)
                    </Label>
                    <Select
                      value={selectedVehicles[idx] || ""}
                      onValueChange={(v) => {
                        const next = [...selectedVehicles];
                        next[idx] = v;
                        setSelectedVehicles(next);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={`Select ${type.replace(
                            "_",
                            " "
                          )} vehicle`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {avail.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.make} {v.model} ({v.registration})
                            <Badge variant="outline" className="ml-2 text-xs">
                              {v.type === "armoured" ? "Armoured" : "Soft Skin"}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Driver {idx + 1}</Label>
                    <Select
                      value={carrierDriverIds[idx] || ""}
                      onValueChange={(v) => {
                        const next = [...carrierDriverIds];
                        next[idx] = v;
                        setCarrierDriverIds(next);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {driversAvail.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Escort vehicles and drivers */}
          {maxEscorts > 0 && (
            <div className="space-y-3">
              <Label>Escort vehicles and drivers</Label>
              {Array.from({ length: maxEscorts }, (_, idx) => {
                // Exclude vehicles already chosen in other escort slots and ALL carrier slots
                const excludeVeh = [
                  ...selectedEscorts.filter(
                    (_, i) => i !== idx && selectedEscorts[i]
                  ),
                  ...selectedVehicles,
                ].filter(Boolean) as string[];
                const vehAvail = availableVehicles(undefined, excludeVeh);
                const excludeDrv = [
                  ...carrierDriverIds,
                  ...escortDriverIds.filter(
                    (_, i) => i !== idx && escortDriverIds[i]
                  ),
                ].filter(Boolean) as string[];
                const drvAvail = availableDrivers(excludeDrv);
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <div>
                      <Label className="text-xs">
                        Escort vehicle {idx + 1}
                      </Label>
                      <Select
                        value={selectedEscorts[idx] || ""}
                        onValueChange={(v) => {
                          const next = [...selectedEscorts];
                          next[idx] = v;
                          setSelectedEscorts(next);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehAvail.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.make} {v.model} ({v.registration})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Escort driver {idx + 1}</Label>
                      <Select
                        value={escortDriverIds[idx] || ""}
                        onValueChange={(v) => {
                          const next = [...escortDriverIds];
                          next[idx] = v;
                          setEscortDriverIds(next);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {drvAvail.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Assigning..." : "Assign Resources"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
