
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { Driver } from "@/lib/types";
import { UserCheck, AlertCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

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
  onDriverAssigned
}: AssignDriverDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState<(Driver & { isAvailable: boolean })[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Load all trips to check for driver availability conflicts
  const { data: allTrips } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          id, date, time, driver_id
        `)
        .neq('id', tripToAssign?.id || '');
      
      if (error) throw error;
      return data as DisplayTrip[];
    },
    enabled: open && !!tripToAssign,
  });

  // Load available drivers and check their availability
  useEffect(() => {
    const fetchDrivers = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("status", "active");
      
      if (!error && data && allTrips && tripToAssign) {
        // Check each driver's availability
        const driversWithAvailability = data.map(driver => {
          // Check if driver is already assigned to another trip on the same day/time
          const conflicts = allTrips.filter(trip => {
            if (trip.driver_id !== driver.id) return false;
            if (trip.date !== tripToAssign.date) return false;
            
            // Convert time strings to minutes
            const selectedTripTime = convertTimeToMinutes(tripToAssign.time || "");
            const existingTripTime = convertTimeToMinutes(trip.time || "");
            
            // Consider a trip within 1 hour as a conflict
            return Math.abs(selectedTripTime - existingTripTime) < 60;
          });

          return {
            ...driver,
            isAvailable: conflicts.length === 0
          };
        });

        setDrivers(driversWithAvailability);
      } else {
        setDrivers([]);
      }
    };

    if (open) {
      fetchDrivers();
      setSelectedDriver("");
      setAssignmentNote("");
      setConflictWarning(null);
    }
  }, [open, allTrips, tripToAssign]);

  // Check for scheduling conflicts when driver is selected
  useEffect(() => {
    if (selectedDriver && tripToAssign && allTrips) {
      // Check if driver is already assigned to another trip on the same day/time
      const conflicts = allTrips.filter(trip => {
        if (trip.driver_id !== selectedDriver) return false;
        if (trip.date !== tripToAssign.date) return false;
        
        // Convert time strings to minutes
        const selectedTripTime = convertTimeToMinutes(tripToAssign.time || "");
        const existingTripTime = convertTimeToMinutes(trip.time || "");
        
        // Consider a trip within 1 hour as a conflict
        return Math.abs(selectedTripTime - existingTripTime) < 60;
      });

      if (conflicts.length > 0) {
        setConflictWarning(`Warning: This driver is already assigned to ${conflicts.length} other trip(s) at a similar time.`);
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
      const { error: assignmentError } = await supabase
        .from("trip_assignments")
        .insert({
          trip_id: tripToAssign.id,
          driver_id: selectedDriver,
          notes: assignmentNote,
          status: "pending" // Using "pending" instead of "assigned"
        });

      if (assignmentError) throw assignmentError;

      // Update trip with new driver ID
      const { error: updateError } = await supabase
        .from("trips")
        .update({ 
          driver_id: selectedDriver,
          status: tripToAssign.status // Keep the current status
        })
        .eq("id", tripToAssign.id);

      if (updateError) throw updateError;
      
      toast({
        title: "Driver assigned",
        description: "Driver has been successfully assigned to the trip",
      });
      
      onDriverAssigned();
      onClose();
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign driver",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedDriver("");
      setAssignmentNote("");
    }
  };

  const formatTripId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };

  // Helper function to convert time string (HH:MM) to minutes for easier comparison
  function convertTimeToMinutes(timeString: string): number {
    if (!timeString) return 0;
    
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 shadow-lg rounded-lg">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <DialogTitle className="text-white flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-purple-400" />
            Assign Driver
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Assign a driver to trip {tripToAssign ? formatTripId(tripToAssign.id) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="driver" className="text-slate-300">Select Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 focus:ring-purple-500 rounded-md">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {drivers.map((driver) => (
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
            <Label htmlFor="notes" className="text-slate-300">Assignment Notes</Label>
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
            onClick={onClose} 
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
