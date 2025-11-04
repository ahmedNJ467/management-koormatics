import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TankFill } from "@/lib/types/fuel";
import { Edit, Trash2, Calendar, Fuel, DollarSign, FileText, Building } from "lucide-react";
import { format } from "date-fns";

interface TankFillDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tankFill: TankFill | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const TankFillDetailsDialog = ({
  isOpen,
  onOpenChange,
  tankFill,
  onEdit,
  onDelete,
}: TankFillDetailsDialogProps) => {
  if (!tankFill) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-10">Tank Fill Details</DialogTitle>
          <DialogDescription>
            View and manage tank fill information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Date and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Date</span>
              </div>
              <p className="text-sm">
                {format(new Date(tankFill.fill_date), "MMM dd, yyyy")}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Fuel className="h-4 w-4" />
                <span className="font-medium">Amount</span>
              </div>
              <p className="text-lg font-semibold font-mono">
                {tankFill.amount} L
              </p>
            </div>
          </div>

          {/* Cost Information */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Cost per Liter</span>
              </div>
              <p className="text-lg font-semibold font-mono">
                {tankFill.cost_per_liter
                  ? `$${Number(tankFill.cost_per_liter).toFixed(2)}`
                  : "—"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Total Cost</span>
              </div>
              <p className="text-lg font-semibold font-mono">
                {tankFill.total_cost
                  ? `$${Number(tankFill.total_cost).toFixed(2)}`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Supplier */}
          {tankFill.supplier && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Building className="h-4 w-4" />
                <span className="font-medium">Supplier</span>
              </div>
              <p className="text-sm">{tankFill.supplier}</p>
            </div>
          )}

          {/* Notes */}
          {tankFill.notes && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Notes</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{tankFill.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
