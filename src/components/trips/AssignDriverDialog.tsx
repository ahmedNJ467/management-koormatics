
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DisplayTrip } from "@/lib/types/trip";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { assignDriverToTrip } from "@/components/trips/operations/driver-operations";
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
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Mock data - in a real app, fetch drivers from an API
  const drivers = [
    { id: "driver1", name: "John Doe" },
    { id: "driver2", name: "Jane Smith" },
    { id: "driver3", name: "Alex Johnson" }
  ];
  
  const handleAssign = async () => {
    if (!selectedDriver || !tripToAssign) return;
    
    setIsLoading(true);
    try {
      await assignDriverToTrip(tripToAssign.id, selectedDriver);
      toast({
        title: "Driver assigned",
        description: "Driver has been assigned to the trip successfully."
      });
      onDriverAssigned();
      onClose();
    } catch (error) {
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description: "Failed to assign driver. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTripId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
          <DialogDescription>
            Select a driver to assign to trip {tripToAssign ? formatTripId(tripToAssign.id) : ""}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Driver</Label>
            <Select
              value={selectedDriver}
              onValueChange={setSelectedDriver}
            >
              <SelectTrigger id="driver">
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
