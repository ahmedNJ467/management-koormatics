import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FuelLogFormValues } from "./schemas/fuel-log-schema";

type MileageFieldsProps = {
  form: UseFormReturn<FuelLogFormValues>;
  hasPreviousMileage?: boolean;
};

export function MileageFields({
  form,
  hasPreviousMileage,
}: MileageFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="previous_mileage">Previous Mileage (km)</Label>
          {/* Keep the registered numeric field hidden; render a read-only display to avoid controlled/uncontrolled switches */}
          <input
            type="number"
            {...form.register("previous_mileage", { valueAsNumber: true })}
            style={{ display: "none" }}
          />
          <Input
            id="previous_mileage_display"
            type="text"
            value={
              hasPreviousMileage
                ? String(form.watch("previous_mileage") ?? "")
                : "-"
            }
            readOnly
            className="bg-muted"
          />
          {form.formState.errors.previous_mileage && (
            <p className="text-sm text-destructive">
              {form.formState.errors.previous_mileage.message}
            </p>
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
            placeholder="Enter current odometer reading"
            {...form.register("current_mileage", {
              valueAsNumber: true,
              onChange: (e) => {
                const value = parseInt(e.target.value);
                form.setValue("current_mileage", isNaN(value) ? 0 : value);

                // Calculate mileage
                if (!hasPreviousMileage) {
                  // For first-time vehicles, align previous to current so distance is 0
                  form.setValue("previous_mileage", isNaN(value) ? 0 : value);
                  form.setValue("mileage", 0);
                } else {
                  const previousMileage = form.getValues("previous_mileage");
                  const mileage = Math.max(0, value - previousMileage);
                  form.setValue("mileage", mileage);
                }
              },
            })}
          />
          {form.formState.errors.current_mileage && (
            <p className="text-sm text-destructive">
              {form.formState.errors.current_mileage.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mileage">Distance (km)</Label>
        <Input
          id="mileage"
          type="text"
          value={String(form.watch("mileage") ?? "")}
          readOnly
          className="bg-muted border border-input"
        />
        <p className="text-xs text-muted-foreground">
          Calculated: Current Mileage − Previous Mileage
        </p>
        {form.formState.errors.mileage && (
          <p className="text-sm text-destructive">
            {form.formState.errors.mileage.message}
          </p>
        )}
      </div>
    </>
  );
}
