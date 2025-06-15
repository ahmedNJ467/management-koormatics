
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";

interface OverdueIndicatorProps {
  trip: DisplayTriip;
  className?: string;
}

export function OverdueIndicator({ trip, className = "" }: OverdueIndicatorProps) {
  // Add safety checks for trip data
  if (!trip || typeof trip !== 'object') {
    console.warn('OverdueIndicator: Invalid trip data', trip);
    return null;
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

  // Only show indicator for scheduled trips
  if (!trip.status || trip.status !== 'scheduled') return null;

  const tripDate = trip.date;
  const tripTime = trip.time;

  // Add safety checks for date and time
  if (!tripDate || typeof tripDate !== 'string' || !tripTime || typeof tripTime !== 'string') {
    console.warn('OverdueIndicator: Invalid date/time data', { tripDate, tripTime });
    return null;
  }

  // Check if trip is overdue
  const isOverdue = tripDate < today || 
    (tripDate === today && tripTime < currentTime);

  // Check if trip is approaching (within 30 minutes)
  const isApproaching = tripDate === today && tripTime <= currentTime && 
    !isOverdue && calculateMinutesDifference(tripTime, currentTime) <= 30;

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
}

function calculateMinutesDifference(tripTime: string, currentTime: string): number {
  // Add safety checks
  if (!tripTime || !currentTime || typeof tripTime !== 'string' || typeof currentTime !== 'string') {
    console.warn('calculateMinutesDifference: Invalid time parameters', { tripTime, currentTime });
    return 0;
  }

  try {
    const tripParts = tripTime.split(':');
    const currentParts = currentTime.split(':');
    
    if (tripParts.length !== 2 || currentParts.length !== 2) {
      console.warn('calculateMinutesDifference: Invalid time format', { tripTime, currentTime });
      return 0;
    }

    const [tripHours, tripMinutes] = tripParts.map(Number);
    const [currentHours, currentMinutes] = currentParts.map(Number);
    
    if (isNaN(tripHours) || isNaN(tripMinutes) || isNaN(currentHours) || isNaN(currentMinutes)) {
      console.warn('calculateMinutesDifference: Non-numeric time values', { tripTime, currentTime });
      return 0;
    }
    
    const tripTotalMinutes = tripHours * 60 + tripMinutes;
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    
    return tripTotalMinutes - currentTotalMinutes;
  } catch (error) {
    console.error('calculateMinutesDifference: Error calculating time difference', error);
    return 0;
  }
}
