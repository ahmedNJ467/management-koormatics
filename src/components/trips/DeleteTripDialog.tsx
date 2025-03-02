
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteTripFromDatabase } from "@/components/trips/operations/delete-operations";
import { useToast } from "@/hooks/use-toast";

interface DeleteTripDialogProps {
  open: boolean;
  tripId?: string;
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
  
  const handleDeleteConfirm = async () => {
    if (!tripId) return;
    
    try {
      await deleteTripFromDatabase(tripId);
      toast({
        title: "Trip deleted",
        description: "Trip has been deleted successfully.",
      });
      onTripDeleted();
      onClose();
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Trip</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this trip? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
