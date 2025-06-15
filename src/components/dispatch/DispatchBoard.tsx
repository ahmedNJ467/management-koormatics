
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DispatchTrips } from "./DispatchTrips";
import { DriverStatus } from "./DriverStatus";
import { DisplayTrip, TripStatus } from "@/lib/types/trip";
import { Driver } from "@/lib/types";
import { Vehicle } from "@/lib/types/vehicle";

interface DispatchBoardProps {
  trips: DisplayTrip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onAssignDriver: (trip: DisplayTrip) => void;
  onSendMessage: (trip: DisplayTrip) => void;
  onCompleteTrip: (trip: DisplayTrip) => void;
  onUpdateStatus: (tripId: string, status: TripStatus) => void;
  onAssignVehicle: (trip: DisplayTrip) => void;
  onGenerateInvoice: (trip: DisplayTrip) => void;
}

export function DispatchBoard({
  trips,
  drivers,
  vehicles,
  onAssignDriver,
  onSendMessage,
  onCompleteTrip,
  onUpdateStatus,
  onAssignVehicle,
  onGenerateInvoice,
}: DispatchBoardProps) {
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Filter upcoming trips (scheduled for today or tomorrow)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Separate trips by status first, then by date for scheduled trips
  const inProgressTrips = trips.filter(trip => trip.status === "in_progress");
  const completedTrips = trips.filter(trip => trip.status === "completed");
  
  const scheduledTrips = trips.filter(trip => trip.status === "scheduled");
  
  // From scheduled trips, separate upcoming (today/tomorrow) from later
  const upcomingTrips = scheduledTrips.filter(trip => {
    if (!trip.date) return false;
    const tripDate = new Date(trip.date);
    tripDate.setHours(0, 0, 0, 0);
    
    return tripDate.getTime() === today.getTime() || 
           tripDate.getTime() === tomorrow.getTime();
  });
  
  // Trips scheduled for later (after tomorrow)
  const laterTrips = scheduledTrips.filter(trip => {
    if (!trip.date) return false;
    const tripDate = new Date(trip.date);
    tripDate.setHours(0, 0, 0, 0);
    
    return tripDate.getTime() > tomorrow.getTime();
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-card-foreground">Trip Management</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-muted border border-border">
                <TabsTrigger value="upcoming" className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Upcoming ({upcomingTrips.length})
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  In Progress ({inProgressTrips.length})
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Scheduled ({laterTrips.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Completed ({completedTrips.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mt-4">
                <DispatchTrips 
                  trips={upcomingTrips}
                  onAssignDriver={onAssignDriver}
                  onSendMessage={onSendMessage}
                  onCompleteTrip={onCompleteTrip}
                  onUpdateStatus={onUpdateStatus}
                  onAssignVehicle={onAssignVehicle}
                  onGenerateInvoice={onGenerateInvoice}
                />
              </TabsContent>
              <TabsContent value="in-progress" className="mt-4">
                <DispatchTrips 
                  trips={inProgressTrips}
                  onAssignDriver={onAssignDriver}
                  onSendMessage={onSendMessage}
                  onCompleteTrip={onCompleteTrip}
                  onUpdateStatus={onUpdateStatus}
                  onAssignVehicle={onAssignVehicle}
                  onGenerateInvoice={onGenerateInvoice}
                />
              </TabsContent>
              <TabsContent value="scheduled" className="mt-4">
                <DispatchTrips 
                  trips={laterTrips}
                  onAssignDriver={onAssignDriver}
                  onSendMessage={onSendMessage}
                  onCompleteTrip={onCompleteTrip}
                  onUpdateStatus={onUpdateStatus}
                  onAssignVehicle={onAssignVehicle}
                  onGenerateInvoice={onGenerateInvoice}
                />
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                <DispatchTrips 
                  trips={completedTrips}
                  onAssignDriver={onAssignDriver}
                  onSendMessage={onSendMessage}
                  onCompleteTrip={onCompleteTrip}
                  onUpdateStatus={onUpdateStatus}
                  onAssignVehicle={onAssignVehicle}
                  onGenerateInvoice={onGenerateInvoice}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-card-foreground">Resource Availability</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <DriverStatus 
              drivers={drivers} 
              vehicles={vehicles}
              trips={trips}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
