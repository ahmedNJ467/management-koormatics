
import { Button } from "@/components/ui/button";
import { Calendar, List, PlusCircle, BarChart } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Trips</h2>
        <p className="text-muted-foreground">Manage and track your fleet trips</p>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/trip-analytics">
          <Button variant="outline" size="sm">
            <BarChart className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </Link>
        <div className="border-r h-8 mx-1" />
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setCalendarView(false)}
          className={!calendarView ? "bg-muted" : ""}
        >
          <List className="mr-2 h-4 w-4" />
          List
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setCalendarView(true)}
          className={calendarView ? "bg-muted" : ""}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Calendar
        </Button>
        <Button onClick={() => setBookingOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Trip
        </Button>
      </div>
    </div>
  );
}
