import { useMemo } from "react";
import { Driver } from "@/lib/types";
import { Vehicle } from "@/lib/types/vehicle";
import { DisplayTrip } from "@/lib/types/trip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock } from "lucide-react";
import { isResourceAvailable } from "@/lib/utils/availability-utils";

interface DriverStatusProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: DisplayTrip[];
}

export function DriverStatus({ drivers, vehicles, trips }: DriverStatusProps) {
  // Memoize availability calculations to force re-computation when trips change
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

  // Determine driver availability based on time-based rules
  const getDriverAvailability = (driverId: string) => {
    return driverAvailabilities.get(driverId) || { isAvailable: true };
  };

  // Determine vehicle availability based on time-based rules and escort assignments
  const getVehicleAvailability = (vehicleId: string) => {
    return vehicleAvailabilities.get(vehicleId) || { isAvailable: true };
  };

  // Get specific assignment type for vehicles
  const getVehicleAssignmentType = (vehicleId: string) => {
    // Check if assigned as primary vehicle
    const hasActiveTrip = trips.some(
      (trip) =>
        trip.vehicle_id === vehicleId &&
        (trip.status === "in_progress" || trip.status === "scheduled")
    );

    if (hasActiveTrip) return "Assigned";

    // Check if assigned as escort
    const isAssignedAsEscort = trips.some(
      (trip) =>
        trip.escort_vehicle_ids &&
        Array.isArray(trip.escort_vehicle_ids) &&
        trip.escort_vehicle_ids.includes(vehicleId) &&
        (trip.status === "in_progress" || trip.status === "scheduled")
    );

    if (isAssignedAsEscort) return "Escort";

    // Check database escort assignment status
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle?.is_escort_assigned) return "Escort";

    return "Available";
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
                    {!availability.isAvailable && availability.reason && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {availability.reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className={`${
                      availability.isAvailable
                        ? "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/40"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40"
                    }`}
                  >
                    {availability.isAvailable ? "Available" : "Busy"}
                  </Badge>
                  {availability.availableAt && !availability.isAvailable && (
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
        Vehicles ({vehicles.length})
      </h3>

      {vehicles.length === 0 ? (
        <p className="text-muted-foreground">No active vehicles found</p>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle) => {
            const availability = getVehicleAvailability(vehicle.id);
            const assignmentType = getVehicleAssignmentType(vehicle.id);

            return (
              <div
                key={vehicle.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex-1">
                  <div className="font-medium text-card-foreground">
                    {vehicle.make} {vehicle.model}
                    {vehicle.type && (
                      <Badge
                        variant={
                          vehicle.type === "armoured" ? "default" : "secondary"
                        }
                        className="text-xs ml-2"
                      >
                        {vehicle.type === "armoured" ? "Armoured" : "Soft Skin"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vehicle.registration}
                    {assignmentType === "Escort" && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {(() => {
                          const escortTrip = trips.find(
                            (trip) =>
                              trip.escort_vehicle_ids &&
                              Array.isArray(trip.escort_vehicle_ids) &&
                              trip.escort_vehicle_ids.includes(vehicle.id)
                          );
                          return escortTrip
                            ? `Escorting: ${escortTrip.id
                                .substring(0, 8)
                                .toUpperCase()}`
                            : "Security Escort";
                        })()}
                      </div>
                    )}
                    {!availability.isAvailable && availability.reason && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {availability.reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className={`${
                      availability.isAvailable
                        ? "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/40"
                        : assignmentType === "Escort"
                        ? "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40"
                    }`}
                  >
                    {availability.isAvailable ? "Available" : assignmentType}
                  </Badge>
                  {availability.availableAt && !availability.isAvailable && (
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
