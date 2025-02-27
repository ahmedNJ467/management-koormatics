
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Driver } from "@/lib/types";

interface DeleteDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | undefined;
  onDelete: () => void;
}

export function DeleteDriverDialog({ open, onOpenChange, driver, onDelete }: DeleteDriverDialogProps) {
  const { toast } = useToast();

  const handleDeleteDriver = async () => {
    if (!driver) return;

    try {
      // First, delete the files from storage if they exist
      if (driver.avatar_url) {
        const avatarFileName = `${driver.id}-avatar.${driver.avatar_url.split('.').pop()}`;
        await supabase.storage
          .from('driver-avatars')
          .remove([avatarFileName]);
      }
      
      if (driver.document_url) {
        const documentFileName = `${driver.id}-document.${driver.document_url.split('.').pop()}`;
        await supabase.storage
          .from('driver-documents')
          .remove([documentFileName]);
      }

      // Then delete the driver record
      const { error } = await supabase
        .from("drivers")
        .delete()
        .eq("id", driver.id);

      if (error) throw error;

      toast({
        title: "Driver deleted",
        description: `${driver.name} has been removed from the system.`,
      });
      onDelete();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Failed to delete driver",
        description: error instanceof Error ? error.message : "Failed to delete driver",
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
            This will permanently delete {driver?.name}'s record and all associated files. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteDriver} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
