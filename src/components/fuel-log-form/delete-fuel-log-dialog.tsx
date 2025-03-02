
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { FuelLog } from "@/lib/types";

interface DeleteFuelLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fuelLog: FuelLog | undefined;
  onDelete: () => void;
}

export function DeleteFuelLogDialog({
  open,
  onOpenChange,
  fuelLog,
  onDelete,
}: DeleteFuelLogDialogProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!fuelLog) return;

    try {
      const { error } = await supabase
        .from("fuel_logs")
        .delete()
        .eq("id", fuelLog.id)
        .single();

      if (error) throw error;

      toast({
        title: "Fuel log deleted",
        description: "The fuel log has been deleted successfully.",
      });

      onDelete();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete fuel log",
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
            This will permanently delete this fuel log. This action cannot be undone.
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
