
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface DeleteClientDialogProps {
  clientName?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  error?: string | null;
  archiveMode?: boolean;
  permanentDelete?: boolean;
  isSubmitting?: boolean;
}

export function DeleteClientDialog({
  clientName,
  isOpen,
  onOpenChange,
  onConfirm,
  error,
  archiveMode = false,
  permanentDelete = false,
  isSubmitting = false
}: DeleteClientDialogProps) {
  const title = permanentDelete
    ? `Permanently delete this client?`
    : archiveMode
      ? `Are you sure you want to archive this client?`
      : `Are you sure you want to delete this client?`;
    
  const description = permanentDelete
    ? `This will permanently delete ${clientName} and all associated data. This action CANNOT be undone.`
    : archiveMode
      ? `This will move ${clientName} to the archive. You can restore it later if needed.`
      : `This will delete ${clientName} and all of their data. This action cannot be undone.`;
    
  const confirmButtonText = permanentDelete 
    ? "Delete Permanently" 
    : archiveMode 
      ? "Archive" 
      : "Delete";
  
  const buttonClass = permanentDelete
    ? "bg-red-600 text-white hover:bg-red-700"
    : archiveMode 
      ? "bg-amber-600 text-white hover:bg-amber-700" 
      : "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {error ? (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <>
                {description}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          {!error && (
            <AlertDialogAction 
              onClick={onConfirm} 
              className={buttonClass}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : confirmButtonText}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
