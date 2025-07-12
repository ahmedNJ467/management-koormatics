import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, User } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";

interface LiveMapProps {
  trips: DisplayTrip[];
}

export function LiveMap({ trips }: LiveMapProps) {
  // Filter active trips that are in progress
  const activeTrips = trips.filter(trip => trip.status === "in_progress");

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-0 shadow-lg h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Live Trip Tracking
          <Badge variant="secondary" className="ml-auto">
            {activeTrips.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        {activeTrips.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active trips to track</p>
              <p className="text-sm text-muted-foreground mt-2">
                Trip locations will appear here when trips are in progress
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 h-full overflow-y-auto">
            {/* Placeholder for map integration */}
            <div className="bg-muted/30 rounded-lg h-48 flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Map Integration</p>
                <p className="text-xs text-muted-foreground">Google Maps / Mapbox integration point</p>
              </div>
            </div>

            {/* Active Trip List */}
            <div className="space-y-2">
              {activeTrips.map(trip => (
                <div key={trip.id} className="bg-muted/50 rounded-lg p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-sm">
                        {trip.driver_name || "Unassigned Driver"}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {trip.id?.substring(0, 8).toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      <span className="truncate">{trip.pickup_location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{trip.dropoff_location}</span>
                    </div>
                    {trip.time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Started at {trip.time}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}