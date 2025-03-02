
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";

interface TripDetailActionsProps {
  viewTrip: DisplayTrip;
  setEditTrip: (trip: DisplayTrip) => void;
  setTripToDelete: (id: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

export function TripDetailActions({ 
  viewTrip, 
  setEditTrip, 
  setTripToDelete, 
  setDeleteDialogOpen 
}: TripDetailActionsProps) {
  return (
    <DialogFooter className="gap-2 mt-6">
      <Button
        variant="outline"
        onClick={() => setEditTrip(viewTrip)}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Trip
      </Button>
      <Button
        variant="destructive"
        onClick={() => {
          setTripToDelete(viewTrip.id);
          setDeleteDialogOpen(true);
        }}
      >
        <Trash className="h-4 w-4 mr-2" />
        Delete Trip
      </Button>
      <DialogClose asChild>
        <Button variant="secondary">
          Close
        </Button>
      </DialogClose>
    </DialogFooter>
  );
}
