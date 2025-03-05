
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteTripFromDatabase } from "@/components/trips/operations/delete-operations";

interface DeleteTripDialogProps {
  open: boolean;
  tripId: string;
  onClose: () => void;
  onTripDeleted: () => void;
}

export function DeleteTripDialog({
  open,
  tripId,
  onClose,
  onTripDeleted
}: DeleteTripDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!tripId || isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      await deleteTripFromDatabase(tripId);
      
      toast({
        title: "Trip deleted",
        description: "Trip has been successfully deleted",
      });
      
      onTripDeleted();
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete trip",
        variant: "destructive",
      });
    } finally {
      // Always make sure we reset state, even if there was an error
      setIsDeleting(false);
      // Call onClose after the deletion process is complete
      onClose();
    }
  };

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the trip
            and all associated messages and driver assignments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Trip"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
