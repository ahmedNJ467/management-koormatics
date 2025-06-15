
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DisplayTrip } from "@/lib/types/trip";
import { Loader2 } from "lucide-react";

interface CompleteTripDialogProps {
  open: boolean;
  trip: DisplayTrip | null;
  onClose: () => void;
  onConfirm: (trip: DisplayTrip, logSheet: File) => Promise<void>;
}

export function CompleteTripDialog({
  open,
  trip,
  onClose,
  onConfirm,
}: CompleteTripDialogProps) {
  const [logSheet, setLogSheet] = useState<File | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogSheet(e.target.files[0]);
      setError(null);
    }
  };

  const handleConfirm = async () => {
    if (!trip || !logSheet) {
      setError("Please select a log sheet file.");
      return;
    }
    setIsCompleting(true);
    setError(null);
    try {
      await onConfirm(trip, logSheet);
      // Let parent handle closing on success
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleClose = () => {
    setLogSheet(null);
    setError(null);
    setIsCompleting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Trip</DialogTitle>
          <DialogDescription>
            To complete the trip, please upload the signed log sheet from the
            passenger.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="log-sheet" className="text-right">
              Log Sheet
            </Label>
            <Input
              id="log-sheet"
              type="file"
              onChange={handleFileChange}
              className="col-span-3"
              accept="image/*,application/pdf"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 col-span-4 text-center">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCompleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!logSheet || isCompleting}>
            {isCompleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Complete Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
