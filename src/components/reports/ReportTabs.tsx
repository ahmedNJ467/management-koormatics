
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabProps, ReportProps } from "./types";
import { Car, Fuel, Wrench, TrendingUp, Users } from "lucide-react";
import { VehiclesReport } from "./tabs/VehiclesReport";
import { FuelReport } from "./tabs/FuelReport";
import { MaintenanceReport } from "./tabs/MaintenanceReport";
import { TripsReport } from "./tabs/TripsReport";
import { DriversReport } from "./tabs/DriversReport";

const reportTabs: TabProps[] = [
  {
    title: "Vehicles",
    value: "vehicles",
    icon: <Car className="h-4 w-4" />,
  },
  {
    title: "Fuel Consumption",
    value: "fuel",
    icon: <Fuel className="h-4 w-4" />,
  },
  {
    title: "Maintenance",
    value: "maintenance",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    title: "Trips",
    value: "trips",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    title: "Drivers",
    value: "drivers",
    icon: <Users className="h-4 w-4" />,
  },
];

export const ReportTabs = ({ timeRange, dateRange }: ReportProps) => {
  const [activeTab, setActiveTab] = useState("vehicles");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
        {reportTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            {tab.icon}
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="vehicles">
        <VehiclesReport />
      </TabsContent>

      <TabsContent value="fuel">
        <FuelReport timeRange={timeRange} dateRange={dateRange} />
      </TabsContent>

      <TabsContent value="maintenance">
        <MaintenanceReport timeRange={timeRange} dateRange={dateRange} />
      </TabsContent>

      <TabsContent value="trips">
        <TripsReport timeRange={timeRange} dateRange={dateRange} />
      </TabsContent>

      <TabsContent value="drivers">
        <DriversReport />
      </TabsContent>
    </Tabs>
  );
};
