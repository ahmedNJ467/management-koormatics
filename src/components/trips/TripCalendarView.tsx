
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DisplayTrip } from "@/lib/types/trip";

// Helper function to get the first day of the month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

interface TripCalendarViewProps {
  filteredTrips: DisplayTrip[] | undefined;
  setViewTrip: (trip: DisplayTrip) => void;
}

export function TripCalendarView({ filteredTrips, setViewTrip }: TripCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Format time
  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return "";
    return format(new Date(`2000-01-01T${timeStr}`), "h:mm a");
  };

  // Calculate calendar days
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trip Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            Previous
          </Button>
          <span className="font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            Next
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-medium text-sm py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the first day of the month */}
          {Array.from({ length: getFirstDayOfMonth(startOfMonth(currentMonth)) }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 p-1 border rounded-md bg-muted/30"></div>
          ))}
          
          {/* Calendar days */}
          {daysInMonth.map((day) => {
            const dayTrips = filteredTrips?.filter(trip => {
              return isSameDay(new Date(trip.date), day);
            }) || [];
            
            return (
              <div 
                key={day.toString()} 
                className={`h-24 p-1 border rounded-md overflow-hidden ${
                  isSameDay(day, new Date()) ? "bg-blue-50 border-blue-200" : ""
                }`}
              >
                <div className="font-medium text-sm mb-1">
                  {format(day, "d")}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[calc(100%-22px)]">
                  {dayTrips.slice(0, 3).map((trip) => (
                    <div 
                      key={trip.id}
                      className="text-xs p-1 rounded cursor-pointer bg-primary/10 truncate"
                      onClick={() => setViewTrip(trip)}
                    >
                      {formatTime(trip.time)} - {trip.client_name}
                    </div>
                  ))}
                  {dayTrips.length > 3 && (
                    <div className="text-xs text-center text-muted-foreground">
                      +{dayTrips.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
