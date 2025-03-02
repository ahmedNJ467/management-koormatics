
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
  Navigation
} from "lucide-react";

interface DetailsTabProps {
  viewTrip: DisplayTrip;
}

export function DetailsTab({ viewTrip }: DetailsTabProps) {
  const isAirportTrip = viewTrip.type === 'airport_pickup' || viewTrip.type === 'airport_dropoff';
  const hasFlightDetails = viewTrip.flight_number || viewTrip.airline || viewTrip.terminal;
  const hasPassengers = viewTrip.client_type === "organization" && viewTrip.passengers && viewTrip.passengers.length > 0;
  
  return (
    <div className="space-y-6">
      <Card className="border-slate-100 dark:border-slate-700 overflow-hidden">
        <CardHeader className="pb-2 bg-slate-50 dark:bg-slate-800">
          <CardTitle className="text-md flex items-center text-slate-700 dark:text-slate-300">
            <Info className="h-4 w-4 mr-2 text-indigo-500" />
            Trip Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 divide-y divide-slate-100 dark:divide-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pb-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-indigo-500" />
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Date</div>
                <div className="text-slate-900 dark:text-slate-200">
                  {formatDate(viewTrip.date)}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5 text-indigo-500" />
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Time</div>
                <div className="text-slate-900 dark:text-slate-200">
                  {viewTrip.time && formatTime(viewTrip.time)}
                  {viewTrip.return_time && ` - ${formatTime(viewTrip.return_time)}`}
                </div>
              </div>
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-start gap-3 mb-3">
              <Navigation className="h-5 w-5 mt-0.5 text-indigo-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Route</div>
              </div>
            </div>
            
            <div className="pl-8 space-y-3">
              {viewTrip.pickup_location && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-0.5 text-emerald-500 mr-2" />
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Pickup Location</div>
                    <div className="text-slate-900 dark:text-slate-200">{viewTrip.pickup_location}</div>
                  </div>
                </div>
              )}
              
              {viewTrip.dropoff_location && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-0.5 text-red-500 mr-2" />
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Dropoff Location</div>
                    <div className="text-slate-900 dark:text-slate-200">{viewTrip.dropoff_location}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 text-indigo-500" />
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Service Type</div>
                <div className="text-slate-900 dark:text-slate-200">
                  {tripTypeDisplayMap[viewTrip.type] || viewTrip.type}
                </div>
              </div>
            </div>

            {isAirportTrip && hasFlightDetails && (
              <div className="flex items-start gap-3">
                <Plane className="h-5 w-5 mt-0.5 text-indigo-500" />
                <div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Flight Details</div>
                  <div className="text-slate-900 dark:text-slate-200">
                    {parseFlightDetails(viewTrip.flight_number, viewTrip.airline, viewTrip.terminal)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <Banknote className="h-5 w-5 mt-0.5 text-indigo-500" />
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount</div>
                <div className="text-slate-900 dark:text-slate-200 font-semibold">
                  ${viewTrip.amount.toFixed(2)}
                </div>
              </div>
            </div>
            
            {hasPassengers && (
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 mt-0.5 text-indigo-500" />
                <div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Passengers</div>
                  <div className="text-slate-900 dark:text-slate-200">
                    {viewTrip.passengers.length} passenger{viewTrip.passengers.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {viewTrip.passengers.slice(0, 2).join(', ')}
                    {viewTrip.passengers.length > 2 && ` +${viewTrip.passengers.length - 2} more`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {viewTrip.notes && (
        <Card className="border-slate-100 dark:border-slate-700">
          <CardHeader className="pb-2 bg-slate-50 dark:bg-slate-800">
            <CardTitle className="text-md flex items-center text-slate-700 dark:text-slate-300">
              <Info className="h-4 w-4 mr-2 text-indigo-500" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-100 dark:border-slate-700">{viewTrip.notes}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
