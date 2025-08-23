import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";

interface OverdueIndicatorProps {
  trip: DisplayTrip;
  className?: string;
}

export function OverdueIndicator({
  trip,
  className = "",
}: OverdueIndicatorProps) {
  // Add safety checks for trip data
  if (!trip || typeof trip !== "object") {
    return null;
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM format

  // Only show indicator for scheduled trips
  if (!trip.status || trip.status !== "scheduled") return null;

  // Get date field - should always be present
  const tripDate = trip.date;
  if (!tripDate || typeof tripDate !== "string") {
    return null; // No console warning, just return null
  }

  // Get time field - try multiple possible field names
  const tripTime = trip.time || trip.start_time;
  if (!tripTime || typeof tripTime !== "string") {
    return null; // No console warning for missing time, just return null
  }

  // Validate date format (should be YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) {
    return null;
  }

  // Validate time format (should be HH:MM or HH:MM:SS)
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(tripTime)) {
    return null;
  }

  // Extract just HH:MM from time if it includes seconds
  const normalizedTripTime = tripTime.substring(0, 5);

  try {
    // Check if trip is overdue
    const isOverdue =
      tripDate < today ||
      (tripDate === today && normalizedTripTime < currentTime);

    // Check if trip is approaching (within 30 minutes)
    const isApproaching =
      tripDate === today &&
      normalizedTripTime <= currentTime &&
      !isOverdue &&
      calculateMinutesDifference(normalizedTripTime, currentTime) <= 30;

    if (isOverdue) {
      return (
        <Badge
          variant="outline"
          className={`bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/50 ${className}`}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    }

    if (isApproaching) {
      return (
        <Badge
          variant="outline"
          className={`bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 ${className}`}
        >
          <Clock className="h-3 w-3 mr-1" />
          Starting Soon
        </Badge>
      );
    }

    return null;
  } catch (error) {
    // Silently handle any errors without console warnings
    return null;
  }
}

function calculateMinutesDifference(
  tripTime: string,
  currentTime: string
): number {
  // Add safety checks
  if (
    !tripTime ||
    !currentTime ||
    typeof tripTime !== "string" ||
    typeof currentTime !== "string"
  ) {
    return 0;
  }

  try {
    const tripParts = tripTime.split(":");
    const currentParts = currentTime.split(":");

    if (tripParts.length < 2 || currentParts.length < 2) {
      return 0;
    }

    const [tripHours, tripMinutes] = tripParts.map(Number);
    const [currentHours, currentMinutes] = currentParts.map(Number);

    if (
      isNaN(tripHours) ||
      isNaN(tripMinutes) ||
      isNaN(currentHours) ||
      isNaN(currentMinutes)
    ) {
      return 0;
    }

    const tripTotalMinutes = tripHours * 60 + tripMinutes;
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    return tripTotalMinutes - currentTotalMinutes;
  } catch (error) {
    return 0;
  }
}
