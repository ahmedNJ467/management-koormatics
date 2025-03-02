
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { fuelLogSchema } from "./use-fuel-log-form";

type VolumePriceProps = {
  form: UseFormReturn<z.infer<typeof fuelLogSchema>>;
};

export function VolumePrice({ form }: VolumePriceProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="volume">Volume (L)</Label>
          <Input
            id="volume"
            type="number"
            step="0.01"
            {...form.register("volume", { 
              valueAsNumber: true,
              onChange: (e) => {
                const value = parseFloat(e.target.value);
                form.setValue("volume", isNaN(value) ? 0 : value);
              }
            })}
          />
          {form.formState.errors.volume && (
            <p className="text-sm text-destructive">{form.formState.errors.volume.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_per_liter">Price per Liter</Label>
          <Input
            id="price_per_liter"
            type="number"
            step="0.01"
            {...form.register("price_per_liter", { 
              valueAsNumber: true,
              onChange: (e) => {
                const value = parseFloat(e.target.value);
                form.setValue("price_per_liter", isNaN(value) ? 0 : value);
              }
            })}
          />
          {form.formState.errors.price_per_liter && (
            <p className="text-sm text-destructive">{form.formState.errors.price_per_liter.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Total Cost (USD)</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          value={form.watch("cost")}
          readOnly
          className="bg-background border border-input"
        />
        <p className="text-xs text-muted-foreground">
          Calculated: Volume × Price per Liter
        </p>
        {form.formState.errors.cost && (
          <p className="text-sm text-destructive">{form.formState.errors.cost.message}</p>
        )}
      </div>
    </>
  );
}
