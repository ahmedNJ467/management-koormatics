
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
import { UserCheck } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 shadow-lg">
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
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-300 focus:ring-purple-500">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id} className="text-slate-300 hover:bg-slate-700 focus:bg-slate-700">
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">Assignment Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment..."
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-300 placeholder:text-slate-500 focus:ring-purple-500 min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-slate-800 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedDriver || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? "Assigning..." : "Assign Driver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
