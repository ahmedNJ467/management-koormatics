
import React from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { DisplayTrip } from "@/lib/types/trip";

// Helper function to get the first day of the month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

interface TripCalendarViewProps {
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  filteredTrips: DisplayTrip[] | undefined;
  setViewTrip: React.Dispatch<React.SetStateAction<DisplayTrip | null>>;
  getStatusColor: (status: string) => string;
  formatTime: (timeStr?: string) => string;
}

const TripCalendarView: React.FC<TripCalendarViewProps> = ({
  currentMonth,
  setCurrentMonth,
  filteredTrips,
  setViewTrip,
  getStatusColor,
  formatTime,
}) => {
  // Calculate calendar days
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
        >
          Previous Month
        </Button>
        <h3 className="text-xl font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
        >
          Next Month
        </Button>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Days of the week */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
          <div key={i} className="text-center font-semibold p-2">
            {day}
          </div>
        ))}
        
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: getFirstDayOfMonth(daysInMonth[0]) }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-50 rounded p-2 min-h-[120px]"></div>
        ))}
        
        {/* Calendar days */}
        {daysInMonth.map((day) => {
          // Get trips for this day
          const dayTrips = filteredTrips?.filter(trip => 
            isSameDay(new Date(trip.date), day)
          ) || [];
          
          return (
            <div 
              key={day.toString()} 
              className={`bg-white border rounded p-2 min-h-[120px] ${
                isSameDay(day, new Date()) ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <div className="font-medium mb-1">{format(day, "d")}</div>
              <div className="space-y-1 overflow-auto max-h-[100px]">
                {dayTrips.length > 0 ? (
                  dayTrips.slice(0, 3).map(trip => (
                    <div 
                      key={trip.id}
                      className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(trip.status)}`}
                      onClick={() => setViewTrip(trip)}
                    >
                      {formatTime(trip.start_time)} - {trip.client_name.split(' ')[0]}
                    </div>
                  ))
                ) : null}
                {dayTrips.length > 3 && (
                  <div className="text-xs text-center text-gray-500">
                    +{dayTrips.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TripCalendarView;
