import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useInterestPoints } from '@/hooks/use-interest-points';
import { InterestPoint } from '@/lib/types/interest-point';
import { AlertTriangle, MapPin } from 'lucide-react';

interface DeleteInterestPointDialogProps {
  open: boolean;
  onClose: () => void;
  interestPoint: InterestPoint;
  onInterestPointDeleted?: () => void;
}

export function DeleteInterestPointDialog({
  open,
  onClose,
  interestPoint,
  onInterestPointDeleted
}: DeleteInterestPointDialogProps) {
  const { deleteInterestPoint, isDeleting } = useInterestPoints();

  const handleDelete = async () => {
    try {
      await deleteInterestPoint(interestPoint.id);
      onInterestPointDeleted?.();
      onClose();
    } catch (error) {
      console.error('Error deleting interest point:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Interest Point
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this interest point? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
          <div
            className="text-3xl"
            style={{ color: interestPoint.color }}
          >
            {interestPoint.icon}
          </div>
          <div className="flex-1">
            <div className="font-medium">{interestPoint.name}</div>
            <div className="text-sm text-muted-foreground">
              {interestPoint.latitude.toFixed(4)}, {interestPoint.longitude.toFixed(4)}
            </div>
            {interestPoint.description && (
              <div className="text-sm text-muted-foreground mt-1">
                {interestPoint.description}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Interest Point'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
