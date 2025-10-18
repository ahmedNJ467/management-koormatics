
import { Car } from "lucide-react";

export function VehiclesLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <Car className="h-8 w-8 animate-pulse text-muted-foreground" />
    </div>
  );
}
