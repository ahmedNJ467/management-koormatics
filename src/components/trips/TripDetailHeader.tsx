
import { DisplayTrip } from "@/lib/types/trip";
import { Building, Car, Navigation } from "lucide-react";

interface TripDetailHeaderProps {
  viewTrip: DisplayTrip;
}

export function TripDetailHeader({ viewTrip }: TripDetailHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg border border-border">
        <Building className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <div className="text-sm text-muted-foreground font-medium">Client</div>
          <div className="text-base font-semibold text-card-foreground">{viewTrip.client_name}</div>
          {viewTrip.client_type && (
            <div className="text-xs text-muted-foreground mt-1">
              {viewTrip.client_type.charAt(0).toUpperCase() + viewTrip.client_type.slice(1)}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg border border-border">
        <Car className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <div className="text-sm text-muted-foreground font-medium">Vehicle</div>
          <div className="text-base font-semibold text-card-foreground">{viewTrip.vehicle_details || "Not specified"}</div>
        </div>
      </div>
      
      <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg border border-border">
        <Navigation className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <div className="text-sm text-muted-foreground font-medium">Route</div>
          <div className="text-base font-semibold text-card-foreground truncate" title={viewTrip.pickup_location}>
            {viewTrip.pickup_location.split(',')[0]}
          </div>
          {viewTrip.dropoff_location && (
            <div className="text-xs text-muted-foreground mt-1 truncate" title={viewTrip.dropoff_location}>
              To: {viewTrip.dropoff_location.split(',')[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
