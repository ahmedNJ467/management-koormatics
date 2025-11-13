import {
  formatDate,
  formatTime,
  parseFlightDetails,
  parsePassengers,
} from "@/components/trips/utils";
import { tripTypeDisplayMap } from "@/lib/types/trip/base-types";
import { DisplayTrip } from "@/lib/types/trip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Calendar,
  Clock,
  Plane,
  Info,
  Navigation,
  Users,
  UserCheck,
  Car,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SecurityEscortSection } from "../SecurityEscortSection";

interface DetailsTabProps {
  viewTrip: DisplayTrip;
}

export function DetailsTab({ viewTrip }: DetailsTabProps) {
  const isAirportTrip =
    viewTrip.type === "airport_pickup" || viewTrip.type === "airport_dropoff";
  const hasFlightDetails =
    viewTrip.flight_number || viewTrip.airline || viewTrip.terminal;

  // Get passengers from both dedicated passengers array and notes
  const notesPassengers = viewTrip.notes ? parsePassengers(viewTrip.notes) : [];
  const arrayPassengers = Array.isArray(viewTrip.passengers)
    ? viewTrip.passengers
    : [];

  // Combine both sources and remove duplicates
  const allPassengers = Array.from(
    new Set([...arrayPassengers, ...notesPassengers])
  );

  // Check if we have passengers to display
  const hasPassengers =
    viewTrip.client_type === "organization" && allPassengers.length > 0;
  const softSkinRequested = (viewTrip.soft_skin_count ?? 0) > 0;
  const armouredRequested = (viewTrip.armoured_count ?? 0) > 0;

  return (
    <div className="space-y-6">
      <Card className="border-border overflow-hidden shadow-md bg-card">
        <CardHeader className="pb-2 bg-muted/50 border-b border-border">
          <CardTitle className="text-md flex items-center text-card-foreground">
            <Info className="h-4 w-4 mr-2 text-primary" />
            Trip Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 divide-y divide-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pb-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Date
                </div>
                <div className="text-foreground">
                  {formatDate(viewTrip.date)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Time
                </div>
                <div className="text-foreground">
                  {viewTrip.time && formatTime(viewTrip.time)}
                  {viewTrip.return_time &&
                    ` - ${formatTime(viewTrip.return_time)}`}
                </div>
              </div>
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-start gap-3 mb-3">
              <Navigation className="h-5 w-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Route
                </div>
              </div>
            </div>

            <div className="pl-8 space-y-3">
              {viewTrip.pickup_location && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-0.5 text-green-500 mr-2" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Pickup Location
                    </div>
                    <div className="text-foreground">
                      {viewTrip.pickup_location}
                    </div>
                  </div>
                </div>
              )}

              {/* Render intermediate stops, if any */}
              {Array.isArray(viewTrip.stops) &&
                viewTrip.stops.length > 0 &&
                viewTrip.stops.map((stop, index) => (
                  <div key={index} className="flex items-start">
                    <MapPin className="h-4 w-4 mt-0.5 text-yellow-500 mr-2" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Stop {index + 1}
                      </div>
                      <div className="text-foreground">{stop}</div>
                    </div>
                  </div>
                ))}

              {viewTrip.dropoff_location && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-0.5 text-red-500 mr-2" />
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Dropoff Location
                    </div>
                    <div className="text-foreground">
                      {viewTrip.dropoff_location}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Service Type
                </div>
                <div className="text-foreground">
                  {tripTypeDisplayMap[viewTrip.type] || viewTrip.type}
                </div>
              </div>
            </div>

            {isAirportTrip && hasFlightDetails && (
              <div className="flex items-start gap-3">
                <Plane className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Flight Details
                  </div>
                  <div className="text-foreground">
                    {parseFlightDetails(
                      viewTrip.flight_number,
                      viewTrip.airline,
                      viewTrip.terminal
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Car className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Soft Skin Vehicles
                </div>
                <div className="text-foreground">
                  {softSkinRequested
                    ? `${viewTrip.soft_skin_count} required`
                    : "Not requested"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 mt-0.5 text-primary" />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Armoured Vehicles
                </div>
                <div className="text-foreground">
                  {armouredRequested
                    ? `${viewTrip.armoured_count} required`
                    : "Not requested"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Escort Information */}
      <SecurityEscortSection trip={viewTrip} />

      {/* Passengers list card - now enhanced to show combined passengers */}
      {hasPassengers && (
        <Card className="border-border overflow-hidden shadow-md bg-card">
          <CardHeader className="pb-2 bg-muted/50 border-b border-border">
            <CardTitle className="text-md flex items-center text-card-foreground">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Passengers ({allPassengers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {allPassengers.map((passenger, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-2 rounded-md bg-muted/50 border border-border"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {passenger.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-foreground">{passenger}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-muted text-muted-foreground border-border"
                  >
                    Passenger {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewTrip.notes && (
        <Card className="border-border shadow-md bg-card">
          <CardHeader className="pb-2 bg-muted/50 border-b border-border">
            <CardTitle className="text-md flex items-center text-card-foreground">
              <Info className="h-4 w-4 mr-2 text-primary" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-sm whitespace-pre-wrap text-muted-foreground bg-muted/50 p-3 rounded-md border border-border">
              {viewTrip.notes}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
