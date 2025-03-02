
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
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");

  // Load available drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("status", "active");
      
      if (!error && data) {
        setDrivers(data);
      }
    };

    if (open) {
      fetchDrivers();
    }
  }, [open]);

  const handleAssign = async () => {
    if (!tripToAssign || !selectedDriver) return;
    
    setIsLoading(true);
    
    try {
      // Create assignment record
      const { error: assignmentError } = await supabase
        .from("trip_assignments")
        .insert({
          trip_id: tripToAssign.id,
          driver_id: selectedDriver,
          notes: assignmentNote,
          status: "assigned"
        });

      if (assignmentError) throw assignmentError;

      // Update trip status if needed
      if (tripToAssign.status === "scheduled") {
        const { error: updateError } = await supabase
          .from("trips")
          .update({ 
            // Store status in notes with a prefix instead of special_instructions
            notes: `STATUS:assigned\n\n${tripToAssign.notes ? tripToAssign.notes.replace(/^STATUS:[a-z_]+\n\n/i, '') : ''}`
          })
          .eq("id", tripToAssign.id);

        if (updateError) throw updateError;
      }
      
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
          <DialogDescription>
            Assign a driver to trip {tripToAssign ? formatTripId(tripToAssign.id) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Select Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Assignment Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment..."
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedDriver || isLoading}
          >
            {isLoading ? "Assigning..." : "Assign Driver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
