
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFuelLogForm } from "./fuel-log-form/use-fuel-log-form";
import type { FuelLog } from "@/lib/types";

interface FuelLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fuelLog?: FuelLog;
}

export function FuelLogFormDialog({ open, onOpenChange, fuelLog }: FuelLogFormDialogProps) {
  const { form, vehicles, isSubmitting, handleSubmit } = useFuelLogForm(fuelLog);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fuelLog ? "Edit Fuel Log" : "Add New Fuel Log"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle_id">Vehicle</Label>
            <Select
              defaultValue={form.getValues("vehicle_id")}
              onValueChange={(value) => form.setValue("vehicle_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} - {vehicle.registration}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.vehicle_id && (
              <p className="text-sm text-destructive">{form.formState.errors.vehicle_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
            />
            {form.formState.errors.date && (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuel_type">Fuel Type</Label>
            <Select
              defaultValue={form.getValues("fuel_type")}
              onValueChange={(value) => form.setValue("fuel_type", value as "petrol" | "diesel")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.fuel_type && (
              <p className="text-sm text-destructive">{form.formState.errors.fuel_type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume (L)</Label>
              <Input
                id="volume"
                type="number"
                step="0.01"
                {...form.register("volume", { valueAsNumber: true })}
              />
              {form.formState.errors.volume && (
                <p className="text-sm text-destructive">{form.formState.errors.volume.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost (USD)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...form.register("cost", { valueAsNumber: true })}
              />
              {form.formState.errors.cost && (
                <p className="text-sm text-destructive">{form.formState.errors.cost.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mileage">Mileage (km)</Label>
            <Input
              id="mileage"
              type="number"
              {...form.register("mileage", { valueAsNumber: true })}
            />
            {form.formState.errors.mileage && (
              <p className="text-sm text-destructive">{form.formState.errors.mileage.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : fuelLog ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
