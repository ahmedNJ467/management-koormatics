
import { Button } from "@/components/ui/button";
import { DisplayTrip } from "@/lib/types/trip";
import { MapPin, User, MessageCircle, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/components/trips/utils";

interface DispatchTripsProps {
  trips: DisplayTrip[];
  onAssignDriver: (trip: DisplayTrip) => void;
  onSendMessage: (trip: DisplayTrip) => void;
}

export function DispatchTrips({
  trips,
  onAssignDriver,
  onSendMessage
}: DispatchTripsProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No trips in this category
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map(trip => (
        <div 
          key={trip.id} 
          className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
            <div className="font-medium text-lg">
              {formatDate(trip.date)} 
              {trip.time && (
                <span className="text-muted-foreground ml-2 text-sm">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatTime(trip.time)}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Trip ID: {trip.id.substring(0, 8).toUpperCase()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <div className="flex items-start gap-1 text-sm mb-1">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Pickup</div>
                  <div>{trip.pickup_location || "Not specified"}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-1 text-sm">
                <MapPin className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Dropoff</div>
                  <div>{trip.dropoff_location || "Not specified"}</div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm mb-1">
                <span className="font-medium">Client:</span> {trip.client_name}
              </div>
              
              <div className="text-sm">
                <span className="font-medium">Driver:</span> {trip.driver_id ? trip.driver_name : "Unassigned"}
              </div>
              
              {trip.passengers && trip.passengers.length > 0 && (
                <div className="text-sm mt-1">
                  <span className="font-medium">Passengers:</span> {trip.passengers.length}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              onClick={() => onAssignDriver(trip)}
              className={trip.driver_id ? "bg-blue-500 hover:bg-blue-600" : "bg-primary"}
            >
              <User className="h-4 w-4 mr-1" />
              {trip.driver_id ? "Reassign Driver" : "Assign Driver"}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onSendMessage(trip)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Send Message
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
