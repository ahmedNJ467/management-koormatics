import { Button } from "@/components/ui/button";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { MapPin, User, MessageCircle, Clock, AlertTriangle, Phone, Plane, MoreVertical, Calendar, Check, X, Car, FileText } from "lucide-react";
import { formatDate, formatTime } from "@/components/trips/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OverdueIndicator } from "./OverdueIndicator";

interface DispatchTripsProps {
  trips: DisplayTrip[];
  onAssignDriver: (trip: DisplayTrip) => void;
  onSendMessage: (trip: DisplayTrip) => void;
  onCompleteTrip: (trip: DisplayTrip) => void;
  onUpdateStatus: (tripId: string, status: TripStatus) => void;
  onAssignVehicle: (trip: DisplayTrip) => void;
  onGenerateInvoice: (trip: DisplayTrip) => void;
}

export function DispatchTrips({
  trips,
  onAssignDriver,
  onSendMessage,
  onCompleteTrip,
  onUpdateStatus,
  onAssignVehicle,
  onGenerateInvoice,
}: DispatchTripsProps) {
  // Ensure we have an array to work with
  const safeTrips = Array.isArray(trips) ? trips.filter(Boolean) : [];
  
  if (safeTrips.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No trips in this category
      </div>
    );
  }

  // Format phone number for display with safety checks
  const formatPhoneNumber = (phone?: string | null) => {
    if (!phone || typeof phone !== 'string') return "No contact info";
    
    // Try to format if it looks like a standard phone number
    if (phone.length === 10 && /^\d+$/.test(phone)) {
      return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
    }
    
    return phone;
  };

  // Check for scheduling conflicts where the same driver is assigned to multiple trips at the same time
  const conflictedDrivers = new Map<string, DisplayTrip[]>();
  const conflictedTrips = new Set<string>();

  // Group trips by date - SAFELY
  const tripsByDate = new Map<string, DisplayTrip[]>();
  safeTrips.forEach(trip => {
    if (!trip || !trip.date) return; // Skip trips without dates
    
    try {
      const dateKey = String(trip.date);
      if (!tripsByDate.has(dateKey)) {
        tripsByDate.set(dateKey, []);
      }
      tripsByDate.get(dateKey)?.push(trip);
    } catch (error) {
      console.error("Error processing trip date:", error, trip);
    }
  });

  // Check for conflicts within each date
  tripsByDate.forEach(dateTrips => {
    // Check each trip against other trips on the same date
    for (let i = 0; i < dateTrips.length; i++) {
      const trip1 = dateTrips[i];
      
      // Skip if no driver assigned or already identified as conflicted
      if (!trip1 || !trip1.driver_id) continue;
      
      for (let j = i + 1; j < dateTrips.length; j++) {
        const trip2 = dateTrips[j];
        
        // Skip if no driver assigned or different drivers
        if (!trip2 || !trip2.driver_id || trip1.driver_id !== trip2.driver_id) continue;
        
        // Check if the times overlap (within 1 hour) - SAFELY
        const time1 = convertTimeToMinutes(trip1.time);
        const time2 = convertTimeToMinutes(trip2.time);
        
        if (Math.abs(time1 - time2) < 60) {
          // Add both trips to the conflicted set if they have valid IDs
          if (trip1.id) conflictedTrips.add(String(trip1.id));
          if (trip2.id) conflictedTrips.add(String(trip2.id));
          
          // Group conflicts by driver
          if (trip1.driver_id) {
            const driverId = String(trip1.driver_id);
            if (!conflictedDrivers.has(driverId)) {
              conflictedDrivers.set(driverId, []);
            }
            
            if (!conflictedDrivers.get(driverId)?.some(t => t.id === trip1.id)) {
              conflictedDrivers.get(driverId)?.push(trip1);
            }
            
            if (!conflictedDrivers.get(driverId)?.some(t => t.id === trip2.id)) {
              conflictedDrivers.get(driverId)?.push(trip2);
            }
          }
        }
      }
    }
  });

  // Safe formatters that don't throw errors
  const safeFormatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr || typeof dateStr !== 'string') return "No date";
    try {
      return formatDate(dateStr);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const safeFormatTime = (timeStr: string | undefined | null): string => {
    if (!timeStr || typeof timeStr !== 'string') return "No time";
    try {
      return formatTime(timeStr);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  // Safe ID formatter
  const safeFormatId = (id: string | number | undefined | null): string => {
    if (!id) return "N/A";
    try {
      const idStr = String(id);
      return idStr.substring(0, 8).toUpperCase();
    } catch (error) {
      console.error("Error formatting ID:", error);
      return "Invalid ID";
    }
  };

  // Safe text formatter for locations and names
  const safeFormatText = (text: string | undefined | null, fallback: string = "Not specified"): string => {
    if (!text || typeof text !== 'string') return fallback;
    return text;
  };

  return (
    <div className="space-y-4">
      {/* Display a warning if there are conflicts */}
      {conflictedDrivers.size > 0 && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-500/50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3>Scheduling Conflicts Detected</h3>
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-200">
            {Array.from(conflictedDrivers.entries()).map(([driverId, trips]) => {
              const driverName = safeFormatText(trips[0]?.driver_name, 'Unknown Driver');
              return (
                <div key={driverId} className="mb-2">
                  <p>
                    <span className="font-medium">{driverName}</span> is assigned to {trips.length} trips at the same time:
                  </p>
                  <ul className="list-disc list-inside pl-2">
                    {trips.map(trip => (
                      <li key={trip.id || Math.random()}>
                        {safeFormatDate(trip.date)} at {safeFormatTime(trip.time)} - {safeFormatText(trip.pickup_location, "No pickup")} to {safeFormatText(trip.dropoff_location, "No dropoff")}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {safeTrips.map(trip => {
        const flightDetails = [trip.airline, trip.flight_number, trip.terminal].filter(Boolean).join(' / ');
        return (
          <div 
            key={trip.id || `trip-${Math.random().toString(36).substring(2, 9)}`} 
            className={`border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow ${
              trip.id && conflictedTrips.has(String(trip.id)) ? 'border-amber-500 dark:border-amber-500/70' : ''
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <div className="font-medium text-lg">
                {safeFormatDate(trip.date)} 
                {trip.time && (
                  <span className="text-muted-foreground ml-2 text-sm">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {safeFormatTime(trip.time)}
                  </span>
                )}
                
                {/* Conflict indicator */}
                {trip.id && conflictedTrips.has(String(trip.id)) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="ml-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Conflict
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>This driver is scheduled for multiple trips at the same time</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Overdue indicator */}
                <OverdueIndicator trip={trip} className="ml-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                Trip ID: {safeFormatId(trip.id)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <div className="flex items-start gap-1 text-sm mb-1">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Pickup</div>
                    <div>{safeFormatText(trip.pickup_location)}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-1 text-sm">
                  <MapPin className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Dropoff</div>
                    <div>{safeFormatText(trip.dropoff_location)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm mb-1">
                  <span className="font-medium">Client:</span> {safeFormatText(trip.client_name)}
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">Driver:</span> {trip.driver_id ? (
                    <span>
                      {safeFormatText(trip.driver_name, "Unknown Driver")}
                      {trip.driver_contact && (
                        <span className="text-xs ml-2 text-muted-foreground">
                          <Phone className="h-3 w-3 inline mr-1" />
                          {formatPhoneNumber(trip.driver_contact)}
                        </span>
                      )}
                    </span>
                  ) : "Unassigned"}
                </div>
                
                {(trip.type === 'airport_pickup' || trip.type === 'airport_dropoff') && flightDetails ? (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-start gap-1 text-sm">
                        <Plane className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                            <div className="font-medium">Flight Details</div>
                            <div className="text-muted-foreground">{flightDetails}</div>
                        </div>
                    </div>
                  </div>
                ) : null}

                {trip.passengers && Array.isArray(trip.passengers) && trip.passengers.length > 0 && (
                  <div className="text-sm mt-1">
                    <span className="font-medium">Passengers:</span> {trip.passengers.length}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <Button 
                size="sm" 
                onClick={() => onAssignDriver(trip)}
                className={trip.driver_id ? "bg-blue-500 hover:bg-blue-600" : "bg-primary"}
              >
                <User className="h-4 w-4 mr-1" />
                Assign Driver
              </Button>

              <Button
                size="sm"
                onClick={() => onAssignVehicle(trip)}
                className={trip.vehicle_id ? "bg-blue-500 hover:bg-blue-600" : "bg-primary"}
              >
                <Car className="h-4 w-4 mr-1" />
                Assign Vehicle
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onSendMessage(trip)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Send Message
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {trip.status !== "scheduled" && (
                    <DropdownMenuItem onClick={() => onUpdateStatus(trip.id, "scheduled")}>
                      <Calendar className="mr-2 h-4 w-4" /> Set as Scheduled
                    </DropdownMenuItem>
                  )}
                  {trip.status !== "in_progress" && (
                    <DropdownMenuItem onClick={() => onUpdateStatus(trip.id, "in_progress")}>
                      <Clock className="mr-2 h-4 w-4" /> Set as In Progress
                    </DropdownMenuItem>
                  )}
                  {trip.status !== "completed" && (
                    <DropdownMenuItem onClick={() => onCompleteTrip(trip)}>
                      <Check className="mr-2 h-4 w-4" /> Complete Trip
                    </DropdownMenuItem>
                  )}
                  {trip.status === 'completed' && !trip.invoice_id && (
                    <DropdownMenuItem onClick={() => onGenerateInvoice(trip)}>
                      <FileText className="mr-2 h-4 w-4" /> Generate Invoice
                    </DropdownMenuItem>
                  )}
                  {trip.status !== "cancelled" && (
                    <DropdownMenuItem className="text-red-500" onClick={() => onUpdateStatus(trip.id, "cancelled")}>
                      <X className="mr-2 h-4 w-4" /> Cancel Trip
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )
      })}
    </div>
  );
}

// Helper function to convert time string (HH:MM) to minutes for easier comparison
function convertTimeToMinutes(timeString: string | undefined | null): number {
  if (!timeString || typeof timeString !== 'string') return 0;
  
  try {
    const parts = timeString.split(':');
    if (parts.length !== 2) return 0;
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    return (isNaN(hours) ? 0 : hours * 60) + (isNaN(minutes) ? 0 : minutes);
  } catch (error) {
    console.error("Error converting time to minutes:", timeString, error);
    return 0;
  }
}
