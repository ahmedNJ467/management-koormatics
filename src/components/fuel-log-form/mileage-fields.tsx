
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FuelLogFormValues } from "./schemas/fuel-log-schema";

type MileageFieldsProps = {
  form: UseFormReturn<FuelLogFormValues>;
};

export function MileageFields({ form }: MileageFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="previous_mileage">Previous Mileage (km)</Label>
          <Input
            id="previous_mileage"
            type="number"
            {...form.register("previous_mileage", { 
              valueAsNumber: true,
              onChange: (e) => {
                const value = parseInt(e.target.value);
                form.setValue("previous_mileage", isNaN(value) ? 0 : value);
              }
            })}
          />
          {form.formState.errors.previous_mileage && (
            <p className="text-sm text-destructive">{form.formState.errors.previous_mileage.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Last recorded odometer reading from previous fuel log
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_mileage">Current Mileage (km)</Label>
          <Input
            id="current_mileage"
            type="number"
            {...form.register("current_mileage", { 
              valueAsNumber: true,
              onChange: (e) => {
                const value = parseInt(e.target.value);
                form.setValue("current_mileage", isNaN(value) ? 0 : value);
              }
            })}
          />
          {form.formState.errors.current_mileage && (
            <p className="text-sm text-destructive">{form.formState.errors.current_mileage.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mileage">Distance (km)</Label>
        <Input
          id="mileage"
          type="number"
          value={form.watch("mileage")}
          readOnly
          className="bg-background border border-input"
        />
        <p className="text-xs text-muted-foreground">
          Calculated: Current Mileage − Previous Mileage
        </p>
        {form.formState.errors.mileage && (
          <p className="text-sm text-destructive">{form.formState.errors.mileage.message}</p>
        )}
      </div>
    </>
  );
}
