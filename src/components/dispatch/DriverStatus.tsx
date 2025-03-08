
import { Driver } from "@/lib/types";
import { DisplayTrip } from "@/lib/types/trip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/string-utils";

interface DriverStatusProps {
  drivers: Driver[];
  trips: DisplayTrip[];
}

export function DriverStatus({ drivers, trips }: DriverStatusProps) {
  // Determine which drivers are assigned to trips today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date);
    tripDate.setHours(0, 0, 0, 0);
    return tripDate.getTime() === today.getTime();
  });
  
  // Get assigned driver IDs and their trip counts
  const assignedDrivers = new Map<string, number>();
  todayTrips.forEach(trip => {
    if (trip.driver_id) {
      const count = assignedDrivers.get(trip.driver_id) || 0;
      assignedDrivers.set(trip.driver_id, count + 1);
    }
  });

  if (drivers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No drivers available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drivers.map(driver => {
        const tripCount = assignedDrivers.get(driver.id) || 0;
        const status = tripCount > 0 ? "assigned" : "available";
        
        return (
          <div
            key={driver.id}
            className="flex items-center gap-3 border-b last:border-b-0 pb-3 last:pb-0 pt-2 first:pt-0"
          >
            <Avatar>
              <AvatarImage src={driver.avatar_url || undefined} />
              <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="font-medium">{driver.name}</div>
              <div className="text-sm text-muted-foreground">{driver.contact || "No contact"}</div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge
                className={status === "assigned" ? "bg-blue-500" : "bg-green-500"}
              >
                {status === "assigned" ? "Assigned" : "Available"}
              </Badge>
              
              {tripCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  {tripCount} trip{tripCount !== 1 ? "s" : ""} today
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
