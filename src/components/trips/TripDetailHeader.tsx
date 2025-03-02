
import { DisplayTrip } from "@/lib/types/trip";
import { Users, Building, Car, Navigation } from "lucide-react";

interface TripDetailHeaderProps {
  viewTrip: DisplayTrip;
}

export function TripDetailHeader({ viewTrip }: TripDetailHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <Building className="h-5 w-5 text-purple-500 mt-0.5" />
        <div>
          <div className="text-sm text-slate-500 font-medium">Client</div>
          <div className="text-base font-semibold text-slate-700">{viewTrip.client_name}</div>
          {viewTrip.client_type && (
            <div className="text-xs text-slate-500 mt-1">
              {viewTrip.client_type.charAt(0).toUpperCase() + viewTrip.client_type.slice(1)}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <Car className="h-5 w-5 text-purple-500 mt-0.5" />
        <div>
          <div className="text-sm text-slate-500 font-medium">Vehicle</div>
          <div className="text-base font-semibold text-slate-700">{viewTrip.vehicle_details || "Not specified"}</div>
        </div>
      </div>
      
      <div className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <Navigation className="h-5 w-5 text-purple-500 mt-0.5" />
        <div>
          <div className="text-sm text-slate-500 font-medium">Route</div>
          <div className="text-base font-semibold text-slate-700 truncate" title={viewTrip.pickup_location}>
            {viewTrip.pickup_location.split(',')[0]}
          </div>
          {viewTrip.dropoff_location && (
            <div className="text-xs text-slate-500 mt-1 truncate" title={viewTrip.dropoff_location}>
              To: {viewTrip.dropoff_location.split(',')[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
