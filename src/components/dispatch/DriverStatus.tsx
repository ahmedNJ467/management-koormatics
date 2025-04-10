
import { Driver } from "@/lib/types";
import { Vehicle } from "@/lib/types/vehicle";
import { DisplayTrip } from "@/lib/types/trip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone } from "lucide-react";

interface DriverStatusProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: DisplayTrip[];
}

export function DriverStatus({ drivers, vehicles, trips }: DriverStatusProps) {
  // Determine driver availability based on assigned trips
  const getDriverAvailability = (driverId: string) => {
    const hasActiveTrip = trips.some(
      trip => trip.driver_id === driverId && 
      (trip.status === "in_progress" || trip.status === "scheduled")
    );
    return !hasActiveTrip;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return "No contact info";
    
    // Try to format if it looks like a standard phone number
    if (phone.length === 10 && /^\d+$/.test(phone)) {
      return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
    }
    
    return phone;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-4">Drivers</h3>
      
      {drivers.length === 0 ? (
        <p className="text-slate-400">No drivers available</p>
      ) : (
        <div className="space-y-3">
          {drivers.map(driver => {
            const isAvailable = getDriverAvailability(driver.id);
            
            return (
              <div 
                key={driver.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-600">
                    <AvatarImage src={driver.avatar_url} alt={driver.name} />
                    <AvatarFallback className="bg-slate-700 text-slate-300">
                      {driver.name?.substring(0, 2).toUpperCase() || "DR"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium text-white">{driver.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatPhoneNumber(driver.contact)}
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={`${
                    isAvailable 
                      ? "bg-green-900/30 text-green-400 border-green-500" 
                      : "bg-amber-900/30 text-amber-400 border-amber-500"
                  }`}
                >
                  {isAvailable ? "Available" : "Assigned"}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
      
      <h3 className="text-lg font-medium text-white mb-4 mt-6">Vehicles</h3>
      
      {vehicles.length === 0 ? (
        <p className="text-slate-400">No vehicles available</p>
      ) : (
        <div className="space-y-3">
          {vehicles.slice(0, 5).map(vehicle => (
            <div 
              key={vehicle.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700"
            >
              <div>
                <div className="font-medium text-white">
                  {vehicle.make} {vehicle.model}
                </div>
                <div className="text-xs text-slate-400">
                  {vehicle.registration}
                </div>
              </div>
              
              <Badge 
                variant="outline" 
                className="bg-green-900/30 text-green-400 border-green-500"
              >
                Available
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
