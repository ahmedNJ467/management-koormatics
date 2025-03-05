
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DisplayTrip } from "@/lib/types/trip";

interface AmountFieldProps {
  editTrip: DisplayTrip | null;
}

export function AmountField({ editTrip }: AmountFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="amount">Trip Amount</Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-gray-500">$</span>
        </div>
        <Input
          type="number"
          id="amount"
          name="amount"
          placeholder="0.00"
          className="pl-8"
          defaultValue={editTrip?.amount || ""}
          min="0"
          step="0.01"
        />
      </div>
      <p className="text-xs text-muted-foreground">Enter the amount charged for this trip</p>
    </div>
  );
}
