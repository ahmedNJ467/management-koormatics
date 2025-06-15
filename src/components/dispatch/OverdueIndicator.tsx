
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";

interface OverdueIndicatorProps {
  trip: DisplayTrip;
  className?: string;
}

export function OverdueIndicator({ trip, className = "" }: OverdueIndicatorProps) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

  // Only show indicator for scheduled trips
  if (trip.status !== 'scheduled') return null;

  const tripDate = trip.date;
  const tripTime = trip.time;

  if (!tripDate || !tripTime) return null;

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
  const [tripHours, tripMinutes] = tripTime.split(':').map(Number);
  const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
  
  const tripTotalMinutes = tripHours * 60 + tripMinutes;
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  
  return tripTotalMinutes - currentTotalMinutes;
}
