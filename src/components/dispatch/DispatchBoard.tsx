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
  onGenerateInvoice: (trip: DisplayTrip) => void;
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
  onGenerateInvoice,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2">
        <div className="border rounded-md bg-card">
          <div className="border-b p-3">
            <div className="text-sm font-medium">Trip management</div>
          </div>
          <div className="p-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-muted border border-border">
                <TabsTrigger
                  value="upcoming"
                  className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  Upcoming ({upcomingTrips.length})
                </TabsTrigger>
                <TabsTrigger
                  value="in-progress"
                  className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  In Progress ({inProgressTrips.length})
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  Scheduled ({laterTrips.length})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  Completed ({completedTrips.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mt-2">
                <DispatchTrips
                  trips={upcomingTrips}
                  vehicles={vehicles}
                  onSendMessage={onSendMessage}
                  onCompleteTrip={onCompleteTrip}
                  onUpdateStatus={onUpdateStatus}
                  onAssignEscort={onAssignEscort}
                  onGenerateInvoice={onGenerateInvoice}
                />
              </TabsContent>
              <TabsContent value="in-progress" className="mt-2">
                <DispatchTrips
                  trips={inProgressTrips}
                  vehicles={vehicles}
                  onSendMessage={onSendMessage}
                  onCompleteTrip={onCompleteTrip}
                  onUpdateStatus={onUpdateStatus}
                  onAssignEscort={onAssignEscort}
                  onGenerateInvoice={onGenerateInvoice}
                />
              </TabsContent>
              <TabsContent value="scheduled" className="mt-2">
                <DispatchTrips
                  trips={laterTrips}
                  vehicles={vehicles}
                  onSendMessage={onSendMessage}
                  onCompleteTrip={onCompleteTrip}
                  onUpdateStatus={onUpdateStatus}
                  onAssignEscort={onAssignEscort}
                  onGenerateInvoice={onGenerateInvoice}
                />
              </TabsContent>
              <TabsContent value="completed" className="mt-2">
                <DispatchTrips
                  trips={completedTrips}
                  vehicles={vehicles}
                  onSendMessage={onSendMessage}
                  onCompleteTrip={onCompleteTrip}
                  onUpdateStatus={onUpdateStatus}
                  onAssignEscort={onAssignEscort}
                  onGenerateInvoice={onGenerateInvoice}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <div>
        <div className="border rounded-md bg-card">
          <div className="border-b p-3">
            <div className="text-sm font-medium">Availability</div>
          </div>
          <div className="p-3">
            <DriverStatus
              key={`${trips.length}-${vehicles.length}-${
                trips.filter((t) => t.status === "cancelled").length
              }-${
                trips.filter((t) => t.escort_vehicle_ids?.length > 0).length
              }-${vehicles.filter((v) => v.is_escort_assigned).length}`}
              drivers={drivers}
              vehicles={vehicles}
              trips={allTrips || trips}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
