
import { formatDate, formatTime, parseFlightDetails } from "@/components/trips/utils";
import { tripTypeDisplayMap } from "@/lib/types/trip/base-types";
import { DisplayTrip } from "@/lib/types/trip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Building, 
  Plane, 
  Banknote, 
  Info,
  Users
} from "lucide-react";

interface DetailsTabProps {
  viewTrip: DisplayTrip;
}

export function DetailsTab({ viewTrip }: DetailsTabProps) {
  const isAirportTrip = viewTrip.type === 'airport_pickup' || viewTrip.type === 'airport_dropoff';
  const hasFlightDetails = viewTrip.flight_number || viewTrip.airline || viewTrip.terminal;
  const hasPassengers = viewTrip.client_type === "organization" && viewTrip.passengers && viewTrip.passengers.length > 0;
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Trip Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Date</div>
              <div className="text-sm text-muted-foreground">
                {formatDate(viewTrip.date)}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Time</div>
              <div className="text-sm text-muted-foreground">
                {viewTrip.time && formatTime(viewTrip.time)}
                {viewTrip.return_time && ` - ${formatTime(viewTrip.return_time)}`}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Locations</div>
              <div className="text-sm text-muted-foreground">
                {viewTrip.pickup_location && (
                  <div>From: {viewTrip.pickup_location}</div>
                )}
                {viewTrip.dropoff_location && (
                  <div>To: {viewTrip.dropoff_location}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Service Type</div>
              <div className="text-sm text-muted-foreground">
                {tripTypeDisplayMap[viewTrip.type] || viewTrip.type}
              </div>
            </div>
          </div>

          {isAirportTrip && hasFlightDetails && (
            <div className="flex items-start gap-2">
              <Plane className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Flight Details</div>
                <div className="text-sm text-muted-foreground">
                  {parseFlightDetails(viewTrip.flight_number, viewTrip.airline, viewTrip.terminal)}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <Banknote className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Amount</div>
              <div className="text-sm text-muted-foreground">
                ${viewTrip.amount.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Participants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Client</div>
              <div className="text-sm text-muted-foreground">
                {viewTrip.client_name}
                {viewTrip.client_type && (
                  <span className="text-xs ml-2 text-muted-foreground">
                    ({viewTrip.client_type})
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Car className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Vehicle</div>
              <div className="text-sm text-muted-foreground">
                {viewTrip.vehicle_details}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Driver</div>
              <div className="text-sm text-muted-foreground">
                {viewTrip.driver_name}
              </div>
            </div>
          </div>

          {hasPassengers && (
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">Passengers</div>
                <div className="text-sm text-muted-foreground">
                  {viewTrip.passengers.length} passenger{viewTrip.passengers.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {viewTrip.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-wrap">{viewTrip.notes}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
