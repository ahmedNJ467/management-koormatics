import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DispatchTrips } from "./DispatchTrips";
import { DriverStatus } from "./DriverStatus";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { Driver } from "@/lib/types";
import { Vehicle } from "@/lib/types/vehicle";
import { isSameDay, isAfter, parseISO } from "date-fns";

interface DispatchBoardProps {
  trips: DisplayTrip[];
  allTrips?: DisplayTrip[]; // unfiltered set for availability calculations
  drivers: Driver[];
  vehicles: Vehicle[];
  onSendMessage: (trip: DisplayTrip) => void;
  onCompleteTrip: (trip: DisplayTrip) => void;
  onUpdateStatus: (tripId: string, status: TripStatus) => void;
  onAssignEscort?: (trip: DisplayTrip) => void;
  variant?: "default" | "overlay";
}

export function DispatchBoard({
  trips,
  allTrips,
  drivers,
  vehicles,
  onSendMessage,
  onCompleteTrip,
  onUpdateStatus,
  onAssignEscort,
  variant = "default",
}: DispatchBoardProps) {
  const [activeTab, setActiveTab] = useState("upcoming");

  // Filter upcoming trips (scheduled for today or tomorrow)
  const { todayStart, tomorrowStart } = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const tmw = new Date(t);
    tmw.setDate(tmw.getDate() + 1);
    return { todayStart: t, tomorrowStart: tmw };
  }, []);

  // Separate trips by status first, then by date for scheduled trips
  const inProgressTrips = trips.filter((trip) => trip.status === "in_progress");
  const completedTrips = trips.filter((trip) => trip.status === "completed");

  const scheduledTrips = trips.filter((trip) => trip.status === "scheduled");

  // From scheduled trips, separate upcoming (today/tomorrow) from later
  const upcomingTrips = scheduledTrips.filter((trip) => {
    if (!trip.date) return false;
    // Use parseISO safely; compare by local day using isSameDay
    const tripDate = parseISO(trip.date);
    return (
      isSameDay(tripDate, todayStart) || isSameDay(tripDate, tomorrowStart)
    );
  });

  // Trips scheduled for later (after tomorrow)
  const laterTrips = scheduledTrips.filter((trip) => {
    if (!trip.date) return false;
    const tripDate = parseISO(trip.date);
    return isAfter(tripDate, tomorrowStart);
  });

  const TabsBlock = (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
        <TabsList className="w-full bg-transparent text-xs px-2 py-1 flex gap-1 overflow-x-auto">
          <TabsTrigger
            value="upcoming"
            className="flex-1 whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            Upcoming ({upcomingTrips.length})
          </TabsTrigger>
          <TabsTrigger
            value="in-progress"
            className="flex-1 whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            In Progress ({inProgressTrips.length})
          </TabsTrigger>
          <TabsTrigger
            value="scheduled"
            className="flex-1 whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            Scheduled ({laterTrips.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="flex-1 whitespace-nowrap data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            Completed ({completedTrips.length})
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <TabsContent value="upcoming" className="mt-0">
          <DispatchTrips
            trips={upcomingTrips}
            vehicles={vehicles}
            onSendMessage={onSendMessage}
            onCompleteTrip={onCompleteTrip}
            onUpdateStatus={onUpdateStatus}
            onAssignEscort={onAssignEscort}
          />
        </TabsContent>
        <TabsContent value="in-progress" className="mt-0">
          <DispatchTrips
            trips={inProgressTrips}
            vehicles={vehicles}
            onSendMessage={onSendMessage}
            onCompleteTrip={onCompleteTrip}
            onUpdateStatus={onUpdateStatus}
            onAssignEscort={onAssignEscort}
          />
        </TabsContent>
        <TabsContent value="scheduled" className="mt-0">
          <DispatchTrips
            trips={laterTrips}
            vehicles={vehicles}
            onSendMessage={onSendMessage}
            onCompleteTrip={onCompleteTrip}
            onUpdateStatus={onUpdateStatus}
            onAssignEscort={onAssignEscort}
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-0">
          <DispatchTrips
            trips={completedTrips}
            vehicles={vehicles}
            onSendMessage={onSendMessage}
            onCompleteTrip={onCompleteTrip}
            onUpdateStatus={onUpdateStatus}
            onAssignEscort={onAssignEscort}
          />
        </TabsContent>
      </div>
    </Tabs>
  );

  if (variant === "overlay") {
    return (
      <div className="flex h-full flex-col overflow-hidden">{TabsBlock}</div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="col-span-1">
        <div className="border rounded-md bg-card">
          <div className="border-b p-3">
            <div className="text-sm font-medium">Trip management</div>
          </div>
          <div className="p-3">{TabsBlock}</div>
        </div>
      </div>
    </div>
  );
}
