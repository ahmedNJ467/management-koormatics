import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FuelLog } from "@/lib/types";
import { Edit, Trash2, Calendar, Car, Fuel, DollarSign, TrendingUp, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FuelLogDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fuelLog: FuelLog | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const FuelLogDetailsDialog = ({
  isOpen,
  onOpenChange,
  fuelLog,
  onEdit,
  onDelete,
}: FuelLogDetailsDialogProps) => {
  if (!fuelLog) return null;

  const costPerLiter = fuelLog.volume > 0 ? fuelLog.cost / fuelLog.volume : 0;
  const isHighCost = fuelLog.cost > 100;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-10">Fuel Log Details</DialogTitle>
          <DialogDescription>
            {fuelLog.vehicle
              ? `${fuelLog.vehicle.make} ${fuelLog.vehicle.model} - ${fuelLog.vehicle.registration}`
              : "Fuel Log Information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Date and Vehicle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Date</span>
              </div>
              <p className="text-sm">
                {format(new Date(fuelLog.date), "MMM dd, yyyy")}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Car className="h-4 w-4" />
                <span className="font-medium">Vehicle</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium">
                  {fuelLog.vehicle
                    ? `${fuelLog.vehicle.make} ${fuelLog.vehicle.model}`
                    : "Unknown Vehicle"}
                </span>
                {fuelLog.vehicle?.registration && (
                  <span className="text-xs text-muted-foreground">
                    {fuelLog.vehicle.registration}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Fuel Type and Volume */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Fuel className="h-4 w-4" />
                <span className="font-medium">Fuel Type</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  fuelLog.fuel_type === "diesel" &&
                    "border-blue-500/30 text-blue-400",
                  fuelLog.fuel_type === "petrol" &&
                    "border-green-500/30 text-green-400"
                )}
              >
                {fuelLog.fuel_type}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Fuel className="h-4 w-4" />
                <span className="font-medium">Volume</span>
              </div>
              <p className="text-lg font-semibold font-mono">
                {fuelLog.volume.toFixed(1)} L
              </p>
            </div>
          </div>

          {/* Cost Information */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Total Cost</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-lg font-semibold font-mono",
                    isHighCost && "text-orange-400"
                  )}
                >
                  ${fuelLog.cost.toFixed(2)}
                </span>
                {isHighCost && (
                  <span className="text-xs text-orange-400">(High)</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">Cost per Liter</span>
              </div>
              <p className="text-lg font-semibold font-mono text-muted-foreground">
                ${costPerLiter.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Mileage Information */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Mileage</span>
              </div>
              <p className="text-lg font-semibold font-mono">
                {fuelLog.mileage ? fuelLog.mileage.toLocaleString() : "—"}
              </p>
            </div>

            {fuelLog.filled_by && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Filled By</span>
                </div>
                <p className="text-sm">{fuelLog.filled_by}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {fuelLog.notes && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="font-medium">Notes</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{fuelLog.notes}</p>
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
