import { DisplayTrip } from "@/lib/types/trip";

export interface AvailabilityOptions {
  bufferHours?: number; // Default 1 hour buffer after return time or completion
  currentDateTime?: Date; // Current date/time for calculations (defaults to now)
}

/**
 * Determines if a vehicle or driver is available based on time-based rules:
 * - Available immediately when trip is marked complete
 * - Available 1 hour after return time for scheduled/in-progress trips
 * - Available 1 hour after pickup time for one-way trips
 */
export function isResourceAvailable(
  resourceId: string,
  resourceType: "driver" | "vehicle",
  trips: DisplayTrip[],
  options: AvailabilityOptions = {}
): {
  isAvailable: boolean;
  reason?: string;
  availableAt?: Date;
  conflictingTrip?: DisplayTrip;
} {
  const { bufferHours = 1, currentDateTime = new Date() } = options;

  // Get all trips for this resource
  const resourceTrips = trips.filter((trip) => {
    if (resourceType === "driver") {
      return trip.driver_id === resourceId;
    } else {
      // For vehicles, check both primary assignment and escort assignment
      return (
        trip.vehicle_id === resourceId ||
        (trip.escort_vehicle_ids &&
          Array.isArray(trip.escort_vehicle_ids) &&
          trip.escort_vehicle_ids.includes(resourceId))
      );
    }
  });

  // Check each trip for conflicts
  for (const trip of resourceTrips) {
    const availability = checkTripAvailability(
      trip,
      currentDateTime,
      bufferHours
    );

    if (!availability.isAvailable) {
      return {
        isAvailable: false,
        reason: availability.reason,
        availableAt: availability.availableAt,
        conflictingTrip: trip,
      };
    }
  }

  return { isAvailable: true };
}

/**
 * Checks if a resource is available considering a specific trip's timing
 */
function checkTripAvailability(
  trip: DisplayTrip,
  currentDateTime: Date,
  bufferHours: number
): {
  isAvailable: boolean;
  reason?: string;
  availableAt?: Date;
} {
  // If trip is cancelled, it doesn't affect availability
  // Using toLowerCase and trim to handle any casing or whitespace issues
  const normalizedStatus = (trip.status || "").toLowerCase().trim();
  if (normalizedStatus === "cancelled") {
    return { isAvailable: true };
  }

  // If trip is completed, resource is immediately available
  if (normalizedStatus === "completed") {
    return { isAvailable: true };
  }

  // For scheduled or in-progress trips, calculate when resource becomes available
  const tripDate = new Date(trip.date);
  const currentDate = new Date(currentDateTime.toDateString());
  const tripDateOnly = new Date(tripDate.toDateString());

  // If trip is on a different date, check date-based availability
  if (tripDateOnly.getTime() !== currentDate.getTime()) {
    // If trip is in the future, resource is available now
    if (tripDateOnly > currentDate) {
      return { isAvailable: true };
    }

    // If trip was in the past and not completed, calculate based on expected end time
    const expectedEndTime = calculateExpectedEndTime(trip, tripDate);
    const availableAt = new Date(
      expectedEndTime.getTime() + bufferHours * 60 * 60 * 1000
    );

    if (currentDateTime >= availableAt) {
      return { isAvailable: true };
    } else {
      return {
        isAvailable: false,
        reason: `Unavailable until ${formatTime(
          availableAt
        )} (${bufferHours}h after expected trip end)`,
        availableAt,
      };
    }
  }

  // Trip is on the same date - check time-based availability
  const expectedEndTime = calculateExpectedEndTime(trip, tripDate);
  const availableAt = new Date(
    expectedEndTime.getTime() + bufferHours * 60 * 60 * 1000
  );

  if (currentDateTime >= availableAt) {
    return { isAvailable: true };
  }

  // Determine the specific reason for unavailability
  const now = currentDateTime;
  const tripStart = parseTimeOnDate(trip.time || "00:00", tripDate);
  const tripEnd = expectedEndTime;

  if (now < tripStart) {
    return {
      isAvailable: false,
      reason: `Scheduled for trip from ${formatTime(tripStart)} to ${formatTime(
        tripEnd
      )}`,
      availableAt,
    };
  } else if (now >= tripStart && now < tripEnd) {
    return {
      isAvailable: false,
      reason: `Currently on trip (until ${formatTime(tripEnd)})`,
      availableAt,
    };
  } else {
    return {
      isAvailable: false,
      reason: `Unavailable until ${formatTime(
        availableAt
      )} (${bufferHours}h buffer after trip)`,
      availableAt,
    };
  }
}

/**
 * Calculates the expected end time for a trip
 */
function calculateExpectedEndTime(trip: DisplayTrip, tripDate: Date): Date {
  // If there's a return time, use it
  if (trip.return_time) {
    return parseTimeOnDate(trip.return_time, tripDate);
  }

  // For one-way trips, estimate duration based on service type
  const pickupTime = parseTimeOnDate(trip.time || "00:00", tripDate);
  let estimatedDurationHours = 2; // Default 2 hours

  switch (trip.service_type || trip.type) {
    case "airport_pickup":
    case "airport_dropoff":
      estimatedDurationHours = 2;
      break;
    case "one_way_transfer":
      estimatedDurationHours = 1.5;
      break;
    case "round_trip":
      estimatedDurationHours = 4;
      break;
    case "full_day":
    case "full_day":
      estimatedDurationHours = 8;
      break;
    case "half_day":
      estimatedDurationHours = 4;
      break;
    default:
      estimatedDurationHours = 2;
  }

  return new Date(
    pickupTime.getTime() + estimatedDurationHours * 60 * 60 * 1000
  );
}

/**
 * Parses a time string (HH:MM) and combines it with a date
 */
function parseTimeOnDate(timeString: string, date: Date): Date {
  const [hours, minutes] = timeString.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Formats a date/time for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Checks if a driver is available for a specific time slot
 */
export function isDriverAvailableForTimeSlot(
  driverId: string,
  targetDate: string,
  targetTime: string,
  trips: DisplayTrip[],
  targetReturnTime?: string,
  excludeTripId?: string,
  options: AvailabilityOptions = {}
): {
  isAvailable: boolean;
  conflicts: DisplayTrip[];
  reason?: string;
} {
  const { bufferHours = 1, currentDateTime = new Date() } = options;

  // Filter trips for this driver, excluding the specified trip
  const driverTrips = trips.filter(
    (trip) =>
      trip.driver_id === driverId &&
      (trip.status || "").toLowerCase().trim() !== "cancelled" &&
      trip.id !== excludeTripId
  );

  const targetDateObj = new Date(targetDate);
  const targetStartTime = parseTimeOnDate(targetTime, targetDateObj);
  const targetEndTime = targetReturnTime
    ? parseTimeOnDate(targetReturnTime, targetDateObj)
    : new Date(targetStartTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  const conflicts: DisplayTrip[] = [];

  for (const trip of driverTrips) {
    const tripDate = new Date(trip.date);
    const tripDateOnly = new Date(tripDate.toDateString());
    const targetDateOnly = new Date(targetDateObj.toDateString());

    // Only check trips on the same date
    if (tripDateOnly.getTime() !== targetDateOnly.getTime()) {
      continue;
    }

    const tripStartTime = parseTimeOnDate(trip.time || "00:00", tripDate);
    const tripEndTime = calculateExpectedEndTime(trip, tripDate);
    const tripAvailableTime = new Date(
      tripEndTime.getTime() + bufferHours * 60 * 60 * 1000
    );

    // Check for time conflicts with buffer
    const hasConflict =
      (targetStartTime >= tripStartTime &&
        targetStartTime < tripAvailableTime) ||
      (targetEndTime > tripStartTime && targetEndTime <= tripAvailableTime) ||
      (targetStartTime <= tripStartTime && targetEndTime >= tripAvailableTime);

    if (hasConflict) {
      conflicts.push(trip);
    }
  }

  const isAvailable = conflicts.length === 0;
  const reason =
    conflicts.length > 0
      ? `Conflicts with ${conflicts.length} existing trip(s) (including ${bufferHours}h buffer)`
      : undefined;

  return {
    isAvailable,
    conflicts,
    reason,
  };
}

/**
 * Checks if a vehicle is available for a specific time slot
 */
export function isVehicleAvailableForTimeSlot(
  vehicleId: string,
  targetDate: string,
  targetTime: string,
  trips: DisplayTrip[],
  targetReturnTime?: string,
  excludeTripId?: string,
  options: AvailabilityOptions = {}
): {
  isAvailable: boolean;
  conflicts: DisplayTrip[];
  reason?: string;
} {
  const { bufferHours = 1 } = options;

  // Filter trips where this vehicle is assigned (primary or escort), excluding the specified trip
  const vehicleTrips = trips.filter(
    (trip) =>
      (trip.vehicle_id === vehicleId ||
        (trip.escort_vehicle_ids &&
          Array.isArray(trip.escort_vehicle_ids) &&
          trip.escort_vehicle_ids.includes(vehicleId))) &&
      (trip.status || "").toLowerCase().trim() !== "cancelled" &&
      trip.id !== excludeTripId
  );

  const targetDateObj = new Date(targetDate);
  const targetStartTime = parseTimeOnDate(targetTime, targetDateObj);
  const targetEndTime = targetReturnTime
    ? parseTimeOnDate(targetReturnTime, targetDateObj)
    : new Date(targetStartTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  const conflicts: DisplayTrip[] = [];

  for (const trip of vehicleTrips) {
    const tripDate = new Date(trip.date);
    const tripDateOnly = new Date(tripDate.toDateString());
    const targetDateOnly = new Date(targetDateObj.toDateString());

    // Only check trips on the same date
    if (tripDateOnly.getTime() !== targetDateOnly.getTime()) {
      continue;
    }

    const tripStartTime = parseTimeOnDate(trip.time || "00:00", tripDate);
    const tripEndTime = calculateExpectedEndTime(trip, tripDate);
    const tripAvailableTime = new Date(
      tripEndTime.getTime() + bufferHours * 60 * 60 * 1000
    );

    // Check for time conflicts with buffer
    const hasConflict =
      (targetStartTime >= tripStartTime &&
        targetStartTime < tripAvailableTime) ||
      (targetEndTime > tripStartTime && targetEndTime <= tripAvailableTime) ||
      (targetStartTime <= tripStartTime && targetEndTime >= tripAvailableTime);

    if (hasConflict) {
      conflicts.push(trip);
    }
  }

  const isAvailable = conflicts.length === 0;
  const reason =
    conflicts.length > 0
      ? `Conflicts with ${conflicts.length} existing trip(s) (including ${bufferHours}h buffer)`
      : undefined;

  return {
    isAvailable,
    conflicts,
    reason,
  };
}
