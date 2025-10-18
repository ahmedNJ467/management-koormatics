import React from "react";
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
import { useInterestPoints } from "@/hooks/use-interest-points";
import { InterestPoint } from "@/lib/types/interest-point";

interface DeleteInterestPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interestPoint: InterestPoint | null;
  onInterestPointDeleted?: () => void;
}

export function DeleteInterestPointDialog({
  open,
  onOpenChange,
  interestPoint,
  onInterestPointDeleted,
}: DeleteInterestPointDialogProps) {
  const { deleteInterestPoint, isDeleting } = useInterestPoints();

  const handleDelete = async () => {
    if (!interestPoint) return;

    try {
      console.log(
        "Deleting interest point:",
        interestPoint.id,
        interestPoint.name
      );
      deleteInterestPoint(interestPoint.id);
      onInterestPointDeleted?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete interest point:", error);
      // The error will be handled by the mutation's onError callback
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Interest Point</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{interestPoint?.name}"? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
