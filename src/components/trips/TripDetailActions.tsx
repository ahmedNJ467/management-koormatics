
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { EditIcon, Trash2Icon, XCircle } from "lucide-react";
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
    <DialogFooter className="flex flex-wrap gap-2 mt-6 sm:justify-between border-t pt-4 border-border">
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-purple-500 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 rounded-full px-4"
          onClick={() => setEditTrip(viewTrip)}
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edit Trip
        </Button>
        <Button
          variant="outline" 
          className="border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full px-4"
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
          variant="secondary" 
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-full px-4"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Close
        </Button>
      </DialogClose>
    </DialogFooter>
  );
}
