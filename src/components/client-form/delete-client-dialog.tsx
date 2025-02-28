
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
}

export function DeleteClientDialog({
  clientName,
  isOpen,
  onOpenChange,
  onConfirm,
  error,
  archiveMode = false
}: DeleteClientDialogProps) {
  const title = archiveMode
    ? `Are you sure you want to archive this client?`
    : `Are you sure you want to delete this client?`;
    
  const description = archiveMode
    ? `This will move ${clientName} to the archive. You can restore it later if needed.`
    : `This will permanently delete ${clientName} and all of their data. This action cannot be undone.`;
    
  const confirmButtonText = archiveMode ? "Archive" : "Delete";
  
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!error && (
            <AlertDialogAction 
              onClick={onConfirm} 
              className={archiveMode 
                ? "bg-amber-600 text-white hover:bg-amber-700" 
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {confirmButtonText}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
