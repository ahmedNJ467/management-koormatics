import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { EditIcon, Trash2Icon, XCircle } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";
// Completing trips from Trips is disabled; use Dispatch instead

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
  setDeleteDialogOpen,
}: TripDetailActionsProps) {
  // No completion from Trips page

  return (
    <DialogFooter className="flex flex-wrap gap-2 mt-6 sm:justify-between border-t pt-4 border-border">
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="rounded-full border border-primary/40 bg-primary/10 px-4 text-primary hover:bg-primary/15 dark:border-primary/30 dark:bg-primary/15 dark:text-primary"
          onClick={() => setEditTrip(viewTrip)}
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edit Trip
        </Button>
        {/* Completion disabled here; managed from Dispatch */}
        <Button
          variant="outline"
          className="rounded-full border border-destructive/40 bg-destructive/10 px-4 text-destructive hover:bg-destructive/15 dark:border-destructive/40 dark:bg-destructive/20"
          onClick={() => {
            setTripToDelete(viewTrip.id);
            setDeleteDialogOpen(true);
          }}
        >
          <Trash2Icon className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
      <DialogClose asChild>
        <Button
          variant="outline"
          className="rounded-full border border-border px-4 text-foreground hover:bg-muted/70"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Close
        </Button>
      </DialogClose>
    </DialogFooter>
  );
}
