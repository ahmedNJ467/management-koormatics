
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Table as TableIcon } from "lucide-react";

interface TripHeaderProps {
  calendarView: boolean;
  setCalendarView: (view: boolean) => void;
  setBookingOpen: (open: boolean) => void;
}

export function TripHeader({ 
  calendarView, 
  setCalendarView, 
  setBookingOpen 
}: TripHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Trips</h2>
        <p className="text-muted-foreground">Manage trip reservations and driver assignments</p>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setCalendarView(!calendarView)}
        >
          {calendarView ? <TableIcon className="mr-2 h-4 w-4" /> : <Calendar className="mr-2 h-4 w-4" />}
          {calendarView ? "List View" : "Calendar View"}
        </Button>
        <Button onClick={() => setBookingOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Book Trip
        </Button>
      </div>
    </div>
  );
}
