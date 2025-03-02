
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
    <DialogFooter className="flex flex-wrap gap-2 mt-6 sm:justify-between border-t pt-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
          onClick={() => setEditTrip(viewTrip)}
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edit Trip
        </Button>
        <Button
          variant="outline" 
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
        <Button variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700">
          <XCircle className="h-4 w-4 mr-2" />
          Close
        </Button>
      </DialogClose>
    </DialogFooter>
  );
}
