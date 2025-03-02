
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DisplayTrip } from "@/lib/types/trip";
import { Driver } from "@/lib/types";

interface AssignDriverDialogProps {
  open: boolean;
  tripToAssign: DisplayTrip | null;
  assignDriver: string;
  assignNote: string;
  drivers?: Driver[];
  onDriverChange: (driverId: string) => void;
  onNoteChange: (note: string) => void;
  onAssign: () => Promise<void>;
  onClose: () => void;
}

export function AssignDriverDialog({
  open,
  tripToAssign,
  assignDriver,
  assignNote,
  drivers,
  onDriverChange,
  onNoteChange,
  onAssign,
  onClose
}: AssignDriverDialogProps) {
  const formatTripId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
          <DialogDescription>
            Assign a driver to trip {tripToAssign ? formatTripId(tripToAssign.id) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Select Driver</Label>
            <Select 
              value={assignDriver} 
              onValueChange={onDriverChange}
            >
              <SelectTrigger id="driver">
                <SelectValue placeholder="Select driver" />
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
            <Label htmlFor="assignment-note">Note (Optional)</Label>
            <Textarea 
              id="assignment-note" 
              placeholder="Add any instructions or notes for the driver"
              value={assignNote}
              onChange={(e) => onNoteChange(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onAssign}
            disabled={!assignDriver}
          >
            Assign Driver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
