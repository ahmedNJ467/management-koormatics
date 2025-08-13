import { Button } from "@/components/ui/button";
import { Calendar, List, PlusCircle, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { preloadByPath } from "@/routes/pages";

interface TripHeaderProps {
  calendarView: boolean;
  setCalendarView: (view: boolean) => void;
  setBookingOpen: (open: boolean) => void;
  isAnalyticsView?: boolean;
}

export function TripHeader({
  calendarView,
  setCalendarView,
  setBookingOpen,
  isAnalyticsView = false,
}: TripHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {isAnalyticsView && (
        <Link
          to="/trips"
          className="-mt-2 -ml-1 mb-2"
          onMouseEnter={() => preloadByPath("/trips")}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Trips
          </Button>
        </Link>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {isAnalyticsView ? "Trip Analytics" : "Trips"}
          </h2>
        </div>

        {!isAnalyticsView ? (
          <div className="flex items-center gap-2">
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
            <Button variant="outline" onClick={() => setBookingOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Trip
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
