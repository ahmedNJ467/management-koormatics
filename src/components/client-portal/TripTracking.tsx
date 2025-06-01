
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation, Clock, MapPin, Phone, Car, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TripTrackingProps {
  clientUserId: string;
}

export function TripTracking({ clientUserId }: TripTrackingProps) {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

  const { data: activeTrips, isLoading } = useQuery({
    queryKey: ["active-trips-tracking", clientUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_bookings")
        .select(`
          *,
          trips:trip_id (
            id,
            status,
            date,
            time,
            pickup_location,
            dropoff_location,
            drivers (
              id,
              name,
              contact
            ),
            vehicles (
              id,
              make,
              model,
              registration
            )
          )
        `)
        .eq("client_user_id", clientUserId)
        .in("status", ["confirmed", "in_progress"])
        .order("pickup_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const { data: trackingData } = useQuery({
    queryKey: ["trip-tracking-data", selectedTrip],
    queryFn: async () => {
      if (!selectedTrip) return null;
      
      const { data, error } = await supabase
        .from("trip_tracking")
        .select("*")
        .eq("trip_id", selectedTrip)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!selectedTrip,
    refetchInterval: 10000, // Refresh every 10 seconds when tracking
  });

  useEffect(() => {
    if (activeTrips && activeTrips.length > 0 && !selectedTrip) {
      setSelectedTrip(activeTrips[0].trip_id);
    }
  }, [activeTrips, selectedTrip]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "secondary";
      case "in_progress": return "default";
      case "en_route": return "secondary";
      case "arrived": return "default";
      default: return "outline";
    }
  };

  const formatTimeUntilArrival = (estimatedArrival: string) => {
    const now = new Date();
    const arrival = new Date(estimatedArrival);
    const diffMinutes = Math.floor((arrival.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return "Arriving now";
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">Loading active trips...</div>
        </CardContent>
      </Card>
    );
  }

  if (!activeTrips || activeTrips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Trip Tracking
          </CardTitle>
          <CardDescription>
            Real-time tracking for your active trips
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Navigation className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No active trips to track</p>
        </CardContent>
      </Card>
    );
  }

  const currentTrip = activeTrips.find(trip => trip.trip_id === selectedTrip);

  return (
    <div className="space-y-6">
      {/* Trip Selection */}
      {activeTrips.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Trip to Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {activeTrips.map((trip: any) => (
                <Button
                  key={trip.id}
                  variant={selectedTrip === trip.trip_id ? "default" : "outline"}
                  onClick={() => setSelectedTrip(trip.trip_id)}
                  className="justify-start h-auto p-4"
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {trip.pickup_location} → {trip.dropoff_location}
                    </div>
                    <div className="text-sm opacity-70">
                      {trip.pickup_date} at {trip.pickup_time}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Trip Tracking
          </CardTitle>
          <CardDescription>
            Real-time location and status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentTrip && (
            <div className="space-y-6">
              {/* Trip Overview */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-lg">
                      {currentTrip.pickup_location} → {currentTrip.dropoff_location}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentTrip.pickup_date} at {currentTrip.pickup_time}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(currentTrip.status)}>
                    {currentTrip.status}
                  </Badge>
                </div>

                {/* Driver & Vehicle Info */}
                {currentTrip.trips && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{currentTrip.trips.drivers?.name || "Driver TBD"}</div>
                        {currentTrip.trips.drivers?.contact && (
                          <div className="text-sm text-muted-foreground">
                            {currentTrip.trips.drivers.contact}
                          </div>
                        )}
                      </div>
                      {currentTrip.trips.drivers?.contact && (
                        <Button size="sm" variant="outline" className="ml-auto">
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {currentTrip.trips.vehicles?.make} {currentTrip.trips.vehicles?.model}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {currentTrip.trips.vehicles?.registration}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Status */}
              {trackingData && (
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Current Status</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{trackingData.location_address || "Location updating..."}</span>
                    </div>
                    
                    {trackingData.estimated_arrival && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          ETA: {formatTimeUntilArrival(trackingData.estimated_arrival)}
                          <span className="text-muted-foreground ml-2">
                            ({new Date(trackingData.estimated_arrival).toLocaleTimeString()})
                          </span>
                        </span>
                      </div>
                    )}
                    
                    {trackingData.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Note:</strong> {trackingData.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-3">
                    Last updated: {new Date(trackingData.updated_at).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {/* Map Placeholder */}
              <div className="border rounded-lg h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p>Live map view would be displayed here</p>
                  <p className="text-sm">Integration with maps service required</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm">
                  <Phone className="h-3 w-3 mr-1" />
                  Call Driver
                </Button>
                <Button variant="outline" size="sm">
                  <MapPin className="h-3 w-3 mr-1" />
                  Share Location
                </Button>
                <Button variant="outline" size="sm">
                  Emergency Contact
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
