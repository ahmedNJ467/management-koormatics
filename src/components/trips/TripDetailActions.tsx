
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
    <DialogFooter className="flex flex-wrap gap-2 mt-6 sm:justify-between border-t pt-4 border-slate-800/50">
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-purple-800 bg-purple-900/20 text-purple-300 hover:bg-purple-800/30 hover:text-purple-200"
          onClick={() => setEditTrip(viewTrip)}
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edit Trip
        </Button>
        <Button
          variant="outline" 
          className="border-red-800 bg-red-900/20 text-red-300 hover:bg-red-800/30 hover:text-red-200"
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
        <Button variant="secondary" className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700">
          <XCircle className="h-4 w-4 mr-2" />
          Close
        </Button>
      </DialogClose>
    </DialogFooter>
  );
}
