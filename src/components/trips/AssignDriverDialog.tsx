import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { Driver } from "@/lib/types";
import { UserCheck, AlertCircle, Clock } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { isDriverAvailableForTimeSlot } from "@/lib/utils/availability-utils";

interface AssignDriverDialogProps {
  open: boolean;
  tripToAssign: DisplayTrip | null;
  onClose: () => void;
  onDriverAssigned: () => void;
}

export function AssignDriverDialog({
  open,
  tripToAssign,
  onClose,
  onDriverAssigned,
}: AssignDriverDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<
    (Driver & {
      isAvailable: boolean;
      conflicts?: DisplayTrip[];
      reason?: string;
    })[]
  >([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Use the existing trips data from the main query instead of creating a new one
  const allTrips = queryClient.getQueryData<DisplayTrip[]>(["trips"]) || [];

  // Load available drivers and check their availability
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!open) return;

      const { data: drivers, error } = await supabase
        .from("drivers")
        .select("id, name, status")
        .eq("status", "active" as any);

      if (drivers) {
        setAvailableDrivers(
          drivers.map((driver: any) => ({
            id: driver && "id" in driver ? driver.id : "",
            name: driver && "name" in driver ? driver.name : "",
            status: driver && "status" in driver ? driver.status : "",
            contact: "",
            license_number: "",
            license_type: "",
            license_expiry: "",
            avatar_url: undefined,
            created_at: "",
            updated_at: "",
            isAvailable: true,
          }))
        );
      }

      console.log("AssignDriverDialog - Drivers loaded:", {
        driversCount: drivers?.length || 0,
        error,
        tripToAssign: tripToAssign?.id,
        tripDate: tripToAssign?.date,
        tripTime: tripToAssign?.time,
        tripReturnTime: tripToAssign?.return_time,
        drivers: drivers?.map((d) => ({
          id: d && "id" in d ? d.id : "",
          name: d && "name" in d ? d.name : "",
          status: d && "status" in d ? d.status : "",
        })),
      });

      if (error) {
        console.error("Error loading drivers:", error);
        setAvailableDrivers([]);
        return;
      }

      if (!drivers) {
        console.warn("No drivers data received");
        setAvailableDrivers([]);
        return;
      }

      if (!tripToAssign) {
        console.warn("No trip to assign");
        setAvailableDrivers([]);
        return;
      }

      // Filter out the current trip from conflicts check
      const otherTrips = allTrips.filter((trip) => trip.id !== tripToAssign.id);

      // Check each driver's availability using time-based logic
      const driversWithAvailability = drivers.map((driver: any) => {
        const availability = isDriverAvailableForTimeSlot(
          driver.id,
          tripToAssign.date,
          tripToAssign.time || "00:00",
          allTrips,
          tripToAssign.return_time,
          tripToAssign.id,
          { bufferHours: 1 }
        );

        return {
          ...driver,
          isAvailable: availability.isAvailable,
          conflicts: availability.conflicts,
          reason: availability.reason,
        };
      });

      console.log("AssignDriverDialog - Drivers with availability:", {
        totalDrivers: driversWithAvailability.length,
        availableDrivers: driversWithAvailability.filter(
          (d: any) => d.isAvailable
        ).length,
        drivers: driversWithAvailability.map((d: any) => ({
          name: d.name,
          isAvailable: d.isAvailable,
          reason: d.reason,
        })),
      });

      setAvailableDrivers(driversWithAvailability);
    };

    fetchDrivers();

    // Reset form state when dialog opens
    if (open) {
      setSelectedDriver("");
      setAssignmentNote("");
      setConflictWarning(null);
    }
  }, [open, allTrips, tripToAssign]);

  // Check for scheduling conflicts when driver is selected
  useEffect(() => {
    if (selectedDriver && tripToAssign) {
      const availability = isDriverAvailableForTimeSlot(
        selectedDriver,
        tripToAssign.date,
        tripToAssign.time || "00:00",
        allTrips,
        tripToAssign.return_time,
        tripToAssign.id,
        { bufferHours: 1 }
      );

      if (!availability.isAvailable && availability.conflicts.length > 0) {
        setConflictWarning(
          `Warning: ${
            availability.reason ||
            `This driver has ${availability.conflicts.length} conflicting trip(s)`
          }`
        );
      } else {
        setConflictWarning(null);
      }
    } else {
      setConflictWarning(null);
    }
  }, [selectedDriver, tripToAssign, allTrips]);

  const handleAssign = async () => {
    if (!tripToAssign || !selectedDriver) return;

    setIsLoading(true);

    try {
      // Create assignment record with valid status value
      const assignmentData = {
        trip_id: tripToAssign.id,
        driver_id: selectedDriver,
        status: "assigned",
        notes: assignmentNote?.trim() || null,
        assigned_at: new Date().toISOString(),
      };

      const { error: assignmentError } = await supabase
        .from("trip_assignments")
        .upsert(
          [assignmentData] as any,
          {
            onConflict: "trip_id,driver_id",
            ignoreDuplicates: false,
          } as any
        );

      if (assignmentError) {
        console.error("Assignment error details:", assignmentError);
        throw assignmentError;
      }

      // Update trip with new driver ID
      const { error: updateError } = await supabase
        .from("trips")
        .update({
          driver_id: selectedDriver,
          status: tripToAssign.status, // Keep the current status
        } as any)
        .eq("id", tripToAssign.id as any);

      if (updateError) throw updateError;

      // Optimistically update trips cache so UI reflects driver + vehicle status in sync
      queryClient.setQueryData<DisplayTrip[] | undefined>(["trips"], (prev) => {
        if (!prev) return prev as any;
        return prev.map((t) =>
          t.id === tripToAssign.id ? { ...t, driver_id: selectedDriver } : t
        );
      });

      toast({
        title: "Driver assigned",
        description: "Driver has been successfully assigned to the trip",
      });

      // Invalidate trips and vehicles queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });

      onDriverAssigned();
      handleClose();
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to assign driver",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset all form state when closing
    setSelectedDriver("");
    setAssignmentNote("");
    setConflictWarning(null);
    setIsLoading(false);
    onClose();
  };

  const formatTripId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };

  // Helper function to convert time string (HH:MM) to minutes for easier comparison
  function convertTimeToMinutes(timeString: string): number {
    if (!timeString) return 0;

    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 shadow-lg rounded-lg">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <DialogTitle className="text-white flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-purple-400" />
            Assign Driver
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Assign a driver to trip{" "}
            {tripToAssign ? formatTripId(tripToAssign.id) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="driver" className="text-slate-300">
              Select Driver ({availableDrivers.length} available)
            </Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 focus:ring-purple-500 rounded-md">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {availableDrivers.map((driver) => (
                  <SelectItem
                    key={driver.id}
                    value={driver.id}
                    className="text-slate-300 hover:bg-slate-700 focus:bg-slate-700"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{driver.name}</span>
                      <Badge
                        className={`ml-2 ${
                          driver.isAvailable
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-amber-500 hover:bg-amber-600"
                        } text-white text-xs`}
                      >
                        {driver.isAvailable ? "Available" : "Busy"}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {conflictWarning && (
            <div className="bg-amber-900/30 border border-amber-500/50 text-amber-200 p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{conflictWarning}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">
              Assignment Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment..."
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-300 placeholder:text-slate-500 focus:ring-purple-500 min-h-[100px] rounded-md"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-slate-800 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-200 rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedDriver || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full"
          >
            {isLoading ? "Assigning..." : "Assign Driver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
