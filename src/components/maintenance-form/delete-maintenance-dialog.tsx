
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Maintenance } from "@/lib/types";

interface DeleteMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: Maintenance | undefined;
  onDelete: () => void;
}

export function DeleteMaintenanceDialog({
  open,
  onOpenChange,
  maintenance,
  onDelete,
}: DeleteMaintenanceDialogProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!maintenance) return;

    try {
      const { error } = await supabase
        .from("maintenance")
        .delete()
        .eq("id", maintenance.id)
        .single();

      if (error) throw error;

      toast({
        title: "Maintenance record deleted",
        description: "The maintenance record has been deleted successfully.",
      });

      onDelete();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete maintenance record",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this maintenance record. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
