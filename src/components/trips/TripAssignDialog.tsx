
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DisplayTrip } from "@/lib/types/trip";
import { Driver } from "@/lib/types/driver";

interface TripAssignDialogProps {
  assignOpen: boolean;
  setAssignOpen: (open: boolean) => void;
  tripToAssign: DisplayTrip | null;
  assignDriver: string;
  setAssignDriver: (driverId: string) => void;
  assignNote: string;
  setAssignNote: (note: string) => void;
  handleAssignDriver: () => Promise<void>;
  drivers?: Driver[];
}

const TripAssignDialog: React.FC<TripAssignDialogProps> = ({
  assignOpen,
  setAssignOpen,
  tripToAssign,
  assignDriver,
  setAssignDriver,
  assignNote,
  setAssignNote,
  handleAssignDriver,
  drivers,
}) => {
  return (
    <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
          <DialogDescription>
            Assign a driver to this trip. They will receive a notification.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="driver-select">Select Driver</Label>
            <Select value={assignDriver} onValueChange={setAssignDriver}>
              <SelectTrigger id="driver-select">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assign-note">Note (Optional)</Label>
            <Textarea 
              id="assign-note"
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
              placeholder="Add a note for the driver"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={() => setAssignOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssignDriver} disabled={!assignDriver}>
            Assign Driver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TripAssignDialog;
