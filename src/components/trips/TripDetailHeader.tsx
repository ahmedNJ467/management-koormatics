
import { DisplayTrip } from "@/lib/types/trip";

interface TripDetailHeaderProps {
  viewTrip: DisplayTrip;
}

export function TripDetailHeader({ viewTrip }: TripDetailHeaderProps) {
  return (
    <div className="flex items-center mb-4">
      <h2 className="text-2xl font-semibold tracking-tight">
        Trip Details - {viewTrip.id.substring(0, 8).toUpperCase()}
      </h2>
    </div>
  );
}
