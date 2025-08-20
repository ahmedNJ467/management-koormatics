import { useMemo } from "react";
import { Driver } from "@/lib/types";
import { Vehicle } from "@/lib/types/vehicle";
import { DisplayTrip } from "@/lib/types/trip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock } from "lucide-react";
import {
  getExpectedTripEnd,
  isResourceAvailable,
} from "@/lib/utils/availability-utils";

interface DriverStatusProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: DisplayTrip[];
}

export function DriverStatus({ drivers, vehicles, trips }: DriverStatusProps) {
  // Debug logging to track vehicle visibility
  console.log("DriverStatus render:", {
    vehiclesCount: vehicles?.length || 0,
    tripsCount: trips?.length || 0,
    escortVehicles: vehicles?.filter((v) => v.is_escort_assigned)?.length || 0,
    vehiclesSample:
      vehicles?.slice(0, 5).map((v) => ({
        id: v.id,
        make: v.make,
        model: v.model,
        registration: v.registration,
        status: v.status,
        is_escort_assigned: v.is_escort_assigned,
        escort_trip_id: v.escort_trip_id,
      })) || [],
    statusBreakdown:
      vehicles?.reduce((acc, v) => {
        acc[v.status || "undefined"] = (acc[v.status || "undefined"] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
  });

  // Memoize availability calculations to force re-computation when trips or vehicles change
  const driverAvailabilities = useMemo(() => {
    const availabilities = new Map();
    drivers.forEach((driver) => {
      const availability = isResourceAvailable(driver.id, "driver", trips, {
        bufferHours: 1,
        currentDateTime: new Date(),
      });
      availabilities.set(driver.id, {
        isAvailable: availability.isAvailable,
        reason: availability.reason,
        availableAt: availability.availableAt,
        conflictingTrip: availability.conflictingTrip,
      });
    });
    return availabilities;
  }, [drivers, trips]);

  const vehicleAvailabilities = useMemo(() => {
    const availabilities = new Map();
    vehicles.forEach((vehicle) => {
      const availability = isResourceAvailable(vehicle.id, "vehicle", trips, {
        bufferHours: 1,
        currentDateTime: new Date(),
      });
      availabilities.set(vehicle.id, {
        isAvailable: availability.isAvailable,
        reason: availability.reason,
        availableAt: availability.availableAt,
        conflictingTrip: availability.conflictingTrip,
      });
    });
    return availabilities;
  }, [vehicles, trips]);

  // Count vehicles actively assigned as escorts in active trips only
  const activeEscortCount = useMemo(() => {
    try {
      return (vehicles || []).reduce((count, v) => {
        const isActiveEscort = (trips || []).some(
          (t) =>
            (t.status === "in_progress" || t.status === "scheduled") &&
            Array.isArray(t.escort_vehicle_ids) &&
            (t.escort_vehicle_ids as any[]).map(String).includes(String(v.id))
        );
        return count + (isActiveEscort ? 1 : 0);
      }, 0);
    } catch (_) {
      return 0;
    }
  }, [vehicles, trips]);

  // Helpers to determine if a conflicting trip has actually started
  const getTripStart = (t: DisplayTrip) => {
    // Safely handle missing/invalid dates
    if (!t || !t.date) return null;
    const tripDateStr = (t.date || "").split("T")[0];
    const startStr = t.time
      ? `${tripDateStr}T${t.time}`
      : `${tripDateStr}T00:00`;
    const parsed = new Date(startStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };
  const hasTripStarted = (t?: DisplayTrip | null) => {
    if (!t) return false;
    const start = getTripStart(t);
    if (!start) return false;
    return new Date() >= start;
  };

  // Determine driver availability based on time-based rules, mirroring vehicle logic
  const getDriverAvailability = (driverId: string) => {
    return driverAvailabilities.get(driverId) || { isAvailable: true };
  };

  // Determine vehicle availability based on time-based rules and escort assignments
  const getVehicleAvailability = (vehicleId: string) => {
    return vehicleAvailabilities.get(vehicleId) || { isAvailable: true };
  };

  // Get specific assignment type for vehicles with improved logic
  const getVehicleAssignmentType = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);

    // Check if assigned as primary vehicle to any ACTIVE trip only
    const hasPrimaryAssignment = trips.some(
      (trip) =>
        trip.vehicle_id === vehicleId &&
        (trip.status === "in_progress" || trip.status === "scheduled")
    );

    if (hasPrimaryAssignment) return "Assigned";

    // Check if assigned as escort to any ACTIVE trip only
    const hasEscortAssignment = trips.some(
      (trip) =>
        trip.escort_vehicle_ids &&
        Array.isArray(trip.escort_vehicle_ids) &&
        trip.escort_vehicle_ids.includes(vehicleId) &&
        (trip.status === "in_progress" || trip.status === "scheduled")
    );

    if (hasEscortAssignment) return "Escort";

    // Check database escort assignment status as fallback
    // Only trust this if the escort_trip_id corresponds to an ACTIVE trip
    if (vehicle?.is_escort_assigned && vehicle?.escort_trip_id) {
      const escortTripExists = trips.some(
        (trip) =>
          trip.id === vehicle.escort_trip_id &&
          (trip.status === "in_progress" || trip.status === "scheduled")
      );

      if (escortTripExists) return "Escort";

      // If escort trip is not active, clear the assignment
      console.warn(
        `Vehicle ${vehicleId} has orphaned escort assignment to cancelled/completed trip ${vehicle.escort_trip_id}`
      );
    }

    return "Available";
  };

  // Get escort trip details for display
  const getEscortTripDetails = (vehicleId: string) => {
    // First check current active escort assignments
    const escortTrip = trips.find(
      (trip) =>
        trip.escort_vehicle_ids &&
        Array.isArray(trip.escort_vehicle_ids) &&
        trip.escort_vehicle_ids.includes(vehicleId) &&
        (trip.status === "in_progress" || trip.status === "scheduled")
    );

    if (escortTrip) {
      return `Escorting: ${escortTrip.id.substring(0, 8).toUpperCase()}`;
    }

    // Fallback to database assignment if it matches an active trip
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle?.escort_trip_id) {
      const dbEscortTrip = trips.find(
        (trip) =>
          trip.id === vehicle.escort_trip_id &&
          (trip.status === "in_progress" || trip.status === "scheduled")
      );

      if (dbEscortTrip) {
        return `Escorting: ${dbEscortTrip.id.substring(0, 8).toUpperCase()}`;
      }
    }

    return "";
  };

  // Format phone number for display
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return "No contact info";

    // Try to format if it looks like a standard phone number
    if (phone.length === 10 && /^\d+$/.test(phone)) {
      return `(${phone.substring(0, 3)}) ${phone.substring(
        3,
        6
      )}-${phone.substring(6)}`;
    }

    return phone;
  };

  // Ensure we always show all vehicles, regardless of escort assignment
  const displayVehicles = useMemo(() => {
    return (vehicles || []).filter((vehicle) => vehicle && vehicle.id);
  }, [vehicles]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-card-foreground mb-4">
        Drivers ({drivers.length})
      </h3>

      {drivers.length === 0 ? (
        <p className="text-muted-foreground">No active drivers found</p>
      ) : (
        <div className="space-y-3">
          {drivers.map((driver) => {
            const availability = getDriverAvailability(driver.id);
            const conflictingTrip = availability.conflictingTrip as
              | DisplayTrip
              | undefined;
            const started = hasTripStarted(conflictingTrip);

            return (
              <div
                key={driver.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={driver.avatar_url} alt={driver.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {driver.name?.substring(0, 2).toUpperCase() || "DR"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="font-medium text-card-foreground">
                      {driver.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatPhoneNumber(driver.contact)}
                    </div>
                    {!availability.isAvailable && (
                      <>
                        {(() => {
                          const reason = availability.reason || "";
                          const isCurrentTripReason = reason
                            .toLowerCase()
                            .startsWith("currently on trip");
                          return reason && !isCurrentTripReason ? (
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {reason}
                            </div>
                          ) : null;
                        })()}
                        {availability.conflictingTrip && started && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(() => {
                              const t = availability.conflictingTrip;
                              const end = getExpectedTripEnd(t);
                              return `On trip until ${end.toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}`;
                            })()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className={`${
                      availability.isAvailable || !started
                        ? "bg-emerald-500/12 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30"
                        : "bg-amber-500/12 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                    }`}
                  >
                    {availability.isAvailable || !started
                      ? "Available"
                      : "Busy"}
                  </Badge>
                  {availability.availableAt && !started && (
                    <div className="text-xs text-muted-foreground">
                      Available:{" "}
                      {availability.availableAt.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 className="text-lg font-medium text-card-foreground mb-4 mt-6">
        Vehicles ({displayVehicles.length})
        {activeEscortCount > 0 && (
          <span className="text-xs text-red-600 ml-2">
            ({activeEscortCount} on escort duty)
          </span>
        )}
      </h3>

      {displayVehicles.length === 0 ? (
        <p className="text-muted-foreground">No active vehicles found</p>
      ) : (
        <div className="space-y-3">
          {displayVehicles.map((vehicle) => {
            const availability = getVehicleAvailability(vehicle.id);
            const now = new Date();
            const today = new Date(now.toDateString());
            let isCurrentlyOnTrip = false;
            let bookedDateTime = null;
            const futureTrips = trips
              .filter((trip) => {
                const tripDate = new Date(trip.date);
                tripDate.setHours(0, 0, 0, 0);
                const escortIds = Array.isArray(trip.escort_vehicle_ids)
                  ? (trip.escort_vehicle_ids as any[]).map(String)
                  : [];
                const inCarrier = Array.isArray(trip.assigned_vehicle_ids)
                  ? (trip.assigned_vehicle_ids as string[]).includes(vehicle.id)
                  : false;
                const inEscort = escortIds.includes(String(vehicle.id));
                const isAssigned =
                  trip.vehicle_id === vehicle.id || inCarrier || inEscort;
                return (
                  isAssigned &&
                  (trip.status === "scheduled" ||
                    trip.status === "in_progress") &&
                  tripDate > today // strictly in the future
                );
              })
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              );
            if (futureTrips.length > 0) {
              const nextTrip = futureTrips[0];
              const tripDate = new Date(nextTrip.date);
              bookedDateTime = `${tripDate.toLocaleDateString()} ${
                nextTrip.time || ""
              }`;
            }
            isCurrentlyOnTrip = trips.some((trip) => {
              const escortIds = Array.isArray(trip.escort_vehicle_ids)
                ? (trip.escort_vehicle_ids as any[]).map(String)
                : [];
              const inCarrier = Array.isArray(trip.assigned_vehicle_ids)
                ? (trip.assigned_vehicle_ids as string[]).includes(vehicle.id)
                : false;
              const inEscort = escortIds.includes(String(vehicle.id));
              const isAssigned =
                trip.vehicle_id === vehicle.id || inCarrier || inEscort;
              if (
                isAssigned &&
                (trip.status === "in_progress" || trip.status === "scheduled")
              ) {
                const tripDateStr = trip.date.split("T")[0];
                const startStr = trip.time
                  ? `${tripDateStr} ${trip.time}`
                  : null;
                const endStr = trip.return_time
                  ? `${tripDateStr} ${trip.return_time}`
                  : null;
                const tripStart = startStr ? new Date(startStr) : null;
                const tripEnd = endStr ? new Date(endStr) : null;
                if (
                  tripStart &&
                  tripEnd &&
                  now >= tripStart &&
                  now <= tripEnd
                ) {
                  return true;
                }
              }
              return false;
            });
            const isBusy = isCurrentlyOnTrip || !availability.isAvailable;
            const badgeText = isCurrentlyOnTrip
              ? "On Trip"
              : isBusy
              ? "Busy"
              : "Available";
            const badgeClass =
              isCurrentlyOnTrip || isBusy
                ? "bg-amber-500/12 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
                : "bg-emerald-500/12 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30";
            return (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex-1">
                  <div className="font-medium text-card-foreground">
                    {vehicle.make} {vehicle.model}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vehicle.registration}
                    {vehicle.type && (
                      <span className="ml-2 text-muted-foreground">
                        {vehicle.type === "armoured" ? "Armoured" : "Soft Skin"}
                      </span>
                    )}
                    {(() => {
                      const escortInfo = getEscortTripDetails(vehicle.id);
                      return escortInfo ? (
                        <span className="ml-1">{escortInfo}</span>
                      ) : null;
                    })()}
                    {bookedDateTime && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Booked: {bookedDateTime}
                      </div>
                    )}
                    {isCurrentlyOnTrip && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {(() => {
                          // Find the active trip for this vehicle and show its expected end time
                          const activeTrip = trips.find((trip) => {
                            const escortIds = Array.isArray(
                              trip.escort_vehicle_ids
                            )
                              ? (trip.escort_vehicle_ids as any[]).map(String)
                              : [];
                            const inCarrier = Array.isArray(
                              trip.assigned_vehicle_ids
                            )
                              ? (
                                  trip.assigned_vehicle_ids as string[]
                                ).includes(vehicle.id)
                              : false;
                            const inEscort = escortIds.includes(
                              String(vehicle.id)
                            );
                            const isAssigned =
                              trip.vehicle_id === vehicle.id ||
                              inCarrier ||
                              inEscort;
                            return (
                              isAssigned &&
                              (trip.status === "in_progress" ||
                                trip.status === "scheduled")
                            );
                          });
                          if (activeTrip) {
                            const end = getExpectedTripEnd(activeTrip);
                            return `On trip until ${end.toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }
                            )}`;
                          }
                          return "Currently on trip";
                        })()}
                      </div>
                    )}
                    {!availability.isAvailable &&
                      availability.reason &&
                      badgeText === "Available" && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {availability.reason}
                        </div>
                      )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={badgeClass}>
                    {badgeText}
                  </Badge>
                  {availability.availableAt &&
                    !availability.isAvailable &&
                    badgeText === "Available" && (
                      <div className="text-xs text-muted-foreground">
                        Available:{" "}
                        {availability.availableAt.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
