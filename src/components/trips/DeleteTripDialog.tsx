
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    if (!tripId) return;
    
    setIsDeleting(true);
    
    try {
      // Delete related records first
      await supabase.from("trip_messages").delete().eq("trip_id", tripId);
      await supabase.from("trip_assignments").delete().eq("trip_id", tripId);
      
      // Then delete the trip
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripId);

      if (error) throw error;
      
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
      setIsDeleting(false);
      // Call onClose after the deletion process is complete to prevent UI freezing
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => {
      if (!open && !isDeleting) {
        onClose();
      }
    }}>
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
            onClick={handleDelete}
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
