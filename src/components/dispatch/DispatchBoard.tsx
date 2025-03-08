
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DispatchTrips } from "./DispatchTrips";
import { DriverStatus } from "./DriverStatus";
import { DisplayTrip } from "@/lib/types/trip";
import { Driver } from "@/lib/types";
import { Vehicle } from "@/lib/types/vehicle";

interface DispatchBoardProps {
  trips: DisplayTrip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onAssignDriver: (trip: DisplayTrip) => void;
  onSendMessage: (trip: DisplayTrip) => void;
}

export function DispatchBoard({
  trips,
  drivers,
  vehicles,
  onAssignDriver,
  onSendMessage
}: DispatchBoardProps) {
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Filter upcoming trips (scheduled for today or tomorrow)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const upcomingTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date);
    tripDate.setHours(0, 0, 0, 0);
    
    return tripDate.getTime() === today.getTime() || 
           tripDate.getTime() === tomorrow.getTime();
  });
  
  // Trips scheduled for later (after tomorrow)
  const laterTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date);
    tripDate.setHours(0, 0, 0, 0);
    
    return tripDate.getTime() > tomorrow.getTime();
  });
  
  // In progress trips
  const inProgressTrips = trips.filter(trip => trip.status === "in_progress");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Trip Management</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-slate-800 border border-slate-700">
                <TabsTrigger value="upcoming" className="flex-1 data-[state=active]:bg-slate-700">
                  Upcoming ({upcomingTrips.length})
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="flex-1 data-[state=active]:bg-slate-700">
                  In Progress ({inProgressTrips.length})
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="flex-1 data-[state=active]:bg-slate-700">
                  Scheduled ({laterTrips.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mt-4">
                <DispatchTrips 
                  trips={upcomingTrips}
                  onAssignDriver={onAssignDriver}
                  onSendMessage={onSendMessage}
                />
              </TabsContent>
              <TabsContent value="in-progress" className="mt-4">
                <DispatchTrips 
                  trips={inProgressTrips}
                  onAssignDriver={onAssignDriver}
                  onSendMessage={onSendMessage}
                />
              </TabsContent>
              <TabsContent value="scheduled" className="mt-4">
                <DispatchTrips 
                  trips={laterTrips}
                  onAssignDriver={onAssignDriver}
                  onSendMessage={onSendMessage}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white">Resource Availability</CardTitle>
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
