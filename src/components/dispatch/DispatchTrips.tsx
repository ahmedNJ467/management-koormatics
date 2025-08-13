import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import {
  MapPin,
  MessageCircle,
  Clock,
  AlertTriangle,
  Phone,
  Plane,
  MoreVertical,
  Calendar,
  Check,
  X,
  FileText,
  Download,
  Shield,
  Navigation,
  CheckCircle,
} from "lucide-react";
import { formatDate, formatTime } from "@/components/trips/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
// Overdue indicator removed per requirements
import { vehicleAssignmentStatus } from "@/lib/types/trip/trip-utils";
import { Vehicle } from "@/lib/types/vehicle";
import { useToast } from "@/hooks/use-toast";
import { AssignResourcesDialog } from "./AssignResourcesDialog";

interface DispatchTripsProps {
  trips: DisplayTrip[];
  onSendMessage: (trip: DisplayTrip) => void;
  onCompleteTrip: (trip: DisplayTrip) => void;
  onUpdateStatus: (tripId: string, status: TripStatus) => void;
  onAssignEscort?: (trip: DisplayTrip) => void;
  onGenerateInvoice: (trip: DisplayTrip) => void;
  vehicles?: Vehicle[];
}

export function DispatchTrips({
  trips,
  onSendMessage,
  onCompleteTrip,
  onUpdateStatus,
  onAssignEscort,
  onGenerateInvoice,
  vehicles: vehiclesProp,
}: DispatchTripsProps) {
  const getStatusBadgeClass = (status: TripStatus): string => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/12 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30";
      case "in_progress":
        return "bg-amber-500/12 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30";
      case "cancelled":
        return "bg-rose-500/12 text-rose-700 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30";
      case "scheduled":
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30";
    }
  };
  const { toast } = useToast();
  const [assignResourcesOpen, setAssignResourcesOpen] = useState(
    false as boolean
  );
  const [activeTrip, setActiveTrip] = useState<DisplayTrip | null>(null);
  // Prefer passed vehicles to avoid redundant hooks/subscriptions
  const vehicles = vehiclesProp || [];

  // Debug logging for security escort functionality
  console.log("DispatchTrips render:", {
    totalTrips: trips?.length || 0,
    securityEscortTrips:
      trips?.filter((t) => t.has_security_escort)?.length || 0,
    tripsWithSecurityEscort:
      trips
        ?.filter((t) => t.has_security_escort)
        ?.map((t) => ({
          id: t.id,
          has_security_escort: t.has_security_escort,
          escort_count: t.escort_count,
          escort_status: t.escort_status,
          escort_vehicle_ids: t.escort_vehicle_ids,
        })) || [],
    onAssignEscortCallback: typeof onAssignEscort,
    vehiclesAvailable: vehicles?.length || 0,
    vehiclesSample:
      vehicles?.slice(0, 3).map((v) => ({
        id: v.id,
        make: v.make,
        model: v.model,
        registration: v.registration,
        is_escort_assigned: v.is_escort_assigned,
      })) || [],
  });

  // Additional debug for escort vehicle lookup issues
  const escortTrips =
    trips?.filter(
      (t) => t.has_security_escort && t.escort_vehicle_ids?.length > 0
    ) || [];
  if (escortTrips.length > 0) {
    console.log("🔍 ESCORT VEHICLE DEBUGGING:", {
      escortTrips: escortTrips.map((trip) => ({
        tripId: trip.id,
        escortVehicleIds: trip.escort_vehicle_ids,
        escortCount: trip.escort_count,
        escortStatus: trip.escort_status,
      })),
      allVehicleIds: vehicles?.map((v) => v.id) || [],
      vehicleIdMatches: escortTrips.map((trip) => ({
        tripId: trip.id,
        escortIds: trip.escort_vehicle_ids,
        foundVehicles:
          trip.escort_vehicle_ids?.map((escortId) => {
            const vehicle = vehicles?.find((v) => v.id === escortId);
            return {
              searchId: escortId,
              found: !!vehicle,
              vehicle: vehicle
                ? {
                    id: vehicle.id,
                    make: vehicle.make,
                    model: vehicle.model,
                    registration: vehicle.registration,
                  }
                : null,
            };
          }) || [],
      })),
    });
  }

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
    if (!phone || typeof phone !== "string") return "No contact info";

    // Try to format if it looks like a standard phone number
    if (phone.length === 10 && /^\d+$/.test(phone)) {
      return `(${phone.substring(0, 3)}) ${phone.substring(
        3,
        6
      )}-${phone.substring(6)}`;
    }

    return phone;
  };

  // Check for scheduling conflicts where the same driver is assigned to multiple trips at the same time
  const conflictedDrivers = new Map<string, DisplayTrip[]>();
  const conflictedTrips = new Set<string>();

  // Group trips by date - SAFELY
  const tripsByDate = new Map<string, DisplayTrip[]>();
  safeTrips.forEach((trip) => {
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
  tripsByDate.forEach((dateTrips) => {
    // Check each trip against other trips on the same date
    for (let i = 0; i < dateTrips.length; i++) {
      const trip1 = dateTrips[i];

      // Skip if no driver assigned or already identified as conflicted
      if (!trip1 || !trip1.driver_id) continue;

      for (let j = i + 1; j < dateTrips.length; j++) {
        const trip2 = dateTrips[j];

        // Skip if no driver assigned or different drivers
        if (!trip2 || !trip2.driver_id || trip1.driver_id !== trip2.driver_id)
          continue;

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

            if (
              !conflictedDrivers.get(driverId)?.some((t) => t.id === trip1.id)
            ) {
              conflictedDrivers.get(driverId)?.push(trip1);
            }

            if (
              !conflictedDrivers.get(driverId)?.some((t) => t.id === trip2.id)
            ) {
              conflictedDrivers.get(driverId)?.push(trip2);
            }
          }
        }
      }
    }
  });

  // Safe formatters that don't throw errors
  const safeFormatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr || typeof dateStr !== "string") return "No date";
    try {
      return formatDate(dateStr);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const safeFormatTime = (timeStr: string | undefined | null): string => {
    if (!timeStr || typeof timeStr !== "string") return "No time";
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
  const safeFormatText = (
    text: string | undefined | null,
    fallback: string = "Not specified"
  ): string => {
    if (!text || typeof text !== "string") return fallback;
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
            {Array.from(conflictedDrivers.entries()).map(
              ([driverId, trips]) => {
                const driverName = safeFormatText(
                  trips[0]?.driver_name,
                  "Unknown Driver"
                );
                return (
                  <div key={driverId} className="mb-2">
                    <p>
                      <span className="font-medium">{driverName}</span> is
                      assigned to {trips.length} trips at the same time:
                    </p>
                    <ul className="list-disc list-inside pl-2">
                      {trips.map((trip) => (
                        <li key={trip.id || Math.random()}>
                          {safeFormatDate(trip.date)} at{" "}
                          {safeFormatTime(trip.time)} -{" "}
                          {safeFormatText(trip.pickup_location, "No pickup")} to{" "}
                          {safeFormatText(trip.dropoff_location, "No dropoff")}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {safeTrips.map((trip, index) => {
        const flightDetails = [trip.airline, trip.flight_number, trip.terminal]
          .filter(Boolean)
          .join(" / ");
        const { state, totalNeeded, totalAssigned } =
          vehicleAssignmentStatus(trip);

        return (
          <Accordion
            key={trip.id || `trip-${index}`}
            type="single"
            collapsible
            className={`rounded-lg border shadow-sm transition ${
              trip.id && conflictedTrips.has(String(trip.id))
                ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            }`}
          >
            <AccordionItem value="item">
              <AccordionTrigger className="px-6 py-4">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-base font-medium text-slate-900 dark:text-slate-100">
                      {safeFormatDate(trip.date)}
                    </div>
                    {trip.time && (
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Clock className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {safeFormatTime(trip.time)}
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                      #{safeFormatId(trip.id)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {trip.type
                        ?.replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                        "Not specified"}
                    </span>
                    {trip.id && conflictedTrips.has(String(trip.id)) && (
                      <Badge
                        variant="outline"
                        className="text-[11px] bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Conflict
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-3">
                  {/* Route Section */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Navigation className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Route
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Pickup */}
                      <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <div className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">
                            Pickup
                          </div>
                          <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                            {safeFormatText(trip.pickup_location)}
                          </div>
                        </div>
                      </div>

                      {/* Stops */}
                      {Array.isArray(trip.stops) &&
                        trip.stops.length > 0 &&
                        trip.stops.map((stop, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                          >
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <div className="text-xs font-medium text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                                Stop {idx + 1}
                              </div>
                              <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                                {safeFormatText(stop)}
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Dropoff */}
                      <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <div className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">
                            Dropoff
                          </div>
                          <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                            {safeFormatText(trip.dropoff_location)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-4">
                    {/* Client */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Client
                        </span>
                      </div>
                      <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                        {safeFormatText(trip.client_name)}
                      </div>
                      {trip.client_type && (
                        <Badge
                          variant="outline"
                          className="text-[11px] mt-1 bg-slate-500/10 text-slate-700 border-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30"
                        >
                          {trip.client_type === "organization"
                            ? "Organization"
                            : "Individual"}
                        </Badge>
                      )}
                    </div>

                    {/* Service Type */}
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                        Service
                      </div>
                      <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                        {trip.type
                          ?.replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()) ||
                          "Not specified"}
                      </div>
                    </div>

                    {/* Vehicles */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Vehicles
                        </span>
                      </div>

                      {state === "none" && (
                        <Badge
                          variant="outline"
                          className="text-[11px] bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Unassigned
                        </Badge>
                      )}

                      {state === "partial" && (
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className="text-[11px] bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                          >
                            {totalAssigned} of {totalNeeded} assigned
                          </Badge>
                          <div className="text-xs text-slate-500">
                            {totalNeeded - totalAssigned} vehicle(s) needed
                          </div>
                        </div>
                      )}

                      {state === "full" && (
                        <div className="flex flex-wrap gap-1">
                          {trip.assigned_vehicle_ids?.map((vehicleId) => {
                            const assignedVehicle = vehicles.find(
                              (v) => v.id === vehicleId
                            );
                            return assignedVehicle ? (
                              <Badge
                                key={vehicleId}
                                variant="outline"
                                className="text-[11px] bg-slate-500/10 text-slate-700 border-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30"
                              >
                                {assignedVehicle.registration}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    {/* Driver */}
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                        Driver
                      </div>
                      {trip.driver_id ? (
                        <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                          {safeFormatText(trip.driver_name, "Unknown Driver")}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-amber-600"
                        >
                          Unassigned
                        </Badge>
                      )}
                    </div>

                    {/* Security Escort */}
                    {trip.has_security_escort && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-rose-500" />
                          <span className="text-sm font-medium text-rose-700 dark:text-rose-400">
                            Security Escort
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[11px] bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30"
                        >
                          {trip.escort_count || 1} escort vehicle(s) required
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${getStatusBadgeClass(
                        trip.status
                      )}`}
                    >
                      {trip.status.replace("_", " ").toUpperCase()}
                    </Badge>

                    {flightDetails && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Plane className="h-3 w-3" />
                        <span>{flightDetails}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => {
                            setActiveTrip(trip);
                            setAssignResourcesOpen(true);
                          }}
                        >
                          Assign Resources
                        </DropdownMenuItem>

                        {trip.has_security_escort && onAssignEscort && (
                          <DropdownMenuItem
                            onClick={() => onAssignEscort(trip)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Assign Escort
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => onSendMessage(trip)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>

                        {trip.status === "scheduled" && (
                          <DropdownMenuItem
                            onClick={() => {
                              const { state, totalNeeded, totalAssigned } =
                                vehicleAssignmentStatus(trip);
                              const isDriverAssigned = Boolean(trip.driver_id);
                              const isVehiclesReady =
                                state === "full" ||
                                (totalNeeded === 0 &&
                                  (trip.vehicle_id ||
                                    (trip.assigned_vehicle_ids?.length || 0) >
                                      0));
                              if (!isDriverAssigned || !isVehiclesReady) {
                                // Prevent starting and notify why
                                const reasons: string[] = [];
                                if (!isDriverAssigned)
                                  reasons.push("assign a driver");
                                if (!isVehiclesReady)
                                  reasons.push("assign required vehicle(s)");
                                toast({
                                  title: "Cannot start trip",
                                  description: `Please ${reasons.join(
                                    " and "
                                  )} before starting.`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              onUpdateStatus(trip.id, "in_progress");
                            }}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Start Trip
                          </DropdownMenuItem>
                        )}

                        {trip.status === "in_progress" && (
                          <DropdownMenuItem
                            onClick={() => onCompleteTrip(trip)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Trip
                          </DropdownMenuItem>
                        )}

                        {trip.status === "completed" && (
                          <DropdownMenuItem
                            onClick={() => onGenerateInvoice(trip)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Invoice
                          </DropdownMenuItem>
                        )}

                        {trip.status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(trip.id, "cancelled")}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Trip
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}

      <AssignResourcesDialog
        open={assignResourcesOpen}
        trip={activeTrip}
        onClose={() => setAssignResourcesOpen(false)}
        onAssigned={() => {
          // no-op here; parent will refetch via subscriptions
        }}
      />
    </div>
  );
}

// Helper function to convert time string (HH:MM) to minutes for easier comparison
function convertTimeToMinutes(timeString: string | undefined | null): number {
  if (!timeString || typeof timeString !== "string") return 0;

  try {
    const parts = timeString.split(":");
    if (parts.length !== 2) return 0;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    return (isNaN(hours) ? 0 : hours * 60) + (isNaN(minutes) ? 0 : minutes);
  } catch (error) {
    console.error("Error converting time to minutes:", timeString, error);
    return 0;
  }
}
