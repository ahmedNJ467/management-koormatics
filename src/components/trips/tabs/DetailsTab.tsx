
import { formatDate, formatTime, parseFlightDetails } from "@/components/trips/utils";
import { tripTypeDisplayMap } from "@/lib/types/trip/base-types";
import { DisplayTrip } from "@/lib/types/trip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Plane, 
  Banknote, 
  Info,
  Navigation,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface DetailsTabProps {
  viewTrip: DisplayTrip;
}

export function DetailsTab({ viewTrip }: DetailsTabProps) {
  const isAirportTrip = viewTrip.type === 'airport_pickup' || viewTrip.type === 'airport_dropoff';
  const hasFlightDetails = viewTrip.flight_number || viewTrip.airline || viewTrip.terminal;
  const hasPassengers = viewTrip.client_type === "organization" && 
    viewTrip.passengers && 
    Array.isArray(viewTrip.passengers) && 
    viewTrip.passengers.length > 0;
  
  return (
    <div className="space-y-6">
      <Card className="border-slate-800 dark:border-slate-700 overflow-hidden shadow-md bg-slate-900/30">
        <CardHeader className="pb-2 bg-slate-900/70 border-b border-slate-800">
          <CardTitle className="text-md flex items-center text-slate-100">
            <Info className="h-4 w-4 mr-2 text-purple-400" />
            Trip Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 divide-y divide-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pb-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-purple-400" />
              <div>
                <div className="text-sm font-medium text-slate-400">Date</div>
                <div className="text-slate-100">
                  {formatDate(viewTrip.date)}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5 text-purple-400" />
              <div>
                <div className="text-sm font-medium text-slate-400">Time</div>
                <div className="text-slate-100">
                  {viewTrip.time && formatTime(viewTrip.time)}
                  {viewTrip.return_time && ` - ${formatTime(viewTrip.return_time)}`}
                </div>
              </div>
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-start gap-3 mb-3">
              <Navigation className="h-5 w-5 mt-0.5 text-purple-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-400">Route</div>
              </div>
            </div>
            
            <div className="pl-8 space-y-3">
              {viewTrip.pickup_location && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-0.5 text-emerald-400 mr-2" />
                  <div>
                    <div className="text-xs text-slate-500">Pickup Location</div>
                    <div className="text-slate-100">{viewTrip.pickup_location}</div>
                  </div>
                </div>
              )}
              
              {viewTrip.dropoff_location && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-0.5 text-red-400 mr-2" />
                  <div>
                    <div className="text-xs text-slate-500">Dropoff Location</div>
                    <div className="text-slate-100">{viewTrip.dropoff_location}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 text-purple-400" />
              <div>
                <div className="text-sm font-medium text-slate-400">Service Type</div>
                <div className="text-slate-100">
                  {tripTypeDisplayMap[viewTrip.type] || viewTrip.type}
                </div>
              </div>
            </div>

            {isAirportTrip && hasFlightDetails && (
              <div className="flex items-start gap-3">
                <Plane className="h-5 w-5 mt-0.5 text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-slate-400">Flight Details</div>
                  <div className="text-slate-100">
                    {parseFlightDetails(viewTrip.flight_number, viewTrip.airline, viewTrip.terminal)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <Banknote className="h-5 w-5 mt-0.5 text-purple-400" />
              <div>
                <div className="text-sm font-medium text-slate-400">Amount</div>
                <div className="text-slate-100 font-semibold">
                  ${viewTrip.amount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Passengers list card */}
      {hasPassengers && (
        <Card className="border-slate-800 dark:border-slate-700 overflow-hidden shadow-md bg-slate-900/30">
          <CardHeader className="pb-2 bg-slate-900/70 border-b border-slate-800">
            <CardTitle className="text-md flex items-center text-slate-100">
              <Users className="h-4 w-4 mr-2 text-purple-400" />
              Passengers ({viewTrip.passengers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {viewTrip.passengers.map((passenger, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-md bg-slate-800/50 border border-slate-700/50">
                  <div className="h-8 w-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-300 font-medium">
                    {passenger.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-slate-100">{passenger}</div>
                  </div>
                  <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-slate-600">
                    Passenger {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {viewTrip.notes && (
        <Card className="border-slate-800 dark:border-slate-700 shadow-md bg-slate-900/30">
          <CardHeader className="pb-2 bg-slate-900/70 border-b border-slate-800">
            <CardTitle className="text-md flex items-center text-slate-100">
              <Info className="h-4 w-4 mr-2 text-purple-400" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-sm whitespace-pre-wrap text-slate-300 bg-slate-800/50 p-3 rounded-md border border-slate-700/50">{viewTrip.notes}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
