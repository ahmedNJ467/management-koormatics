
import { Car, Fuel, Wrench, TrendingUp, Users, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehiclesReport } from "./tabs/VehiclesReport";
import { FuelReport } from "./tabs/FuelReport";
import { MaintenanceReport } from "./tabs/MaintenanceReport";
import { TripsReport } from "./tabs/TripsReport";
import { DriversReport } from "./tabs/DriversReport";
import { FinancialReport } from "./tabs/FinancialReport";
import { DateRange } from "react-day-picker";

interface TabProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

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
  {
    title: "Financial",
    value: "financial",
    icon: <DollarSign className="h-4 w-4" />,
  },
];

interface ReportsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  vehiclesData: any[] | undefined;
  fuelData: any[] | undefined;
  maintenanceData: any[] | undefined;
  tripsData: any[] | undefined;
  driversData: any[] | undefined;
  isLoadingVehicles: boolean;
  isLoadingFuel: boolean;
  isLoadingMaintenance: boolean;
  isLoadingTrips: boolean;
  isLoadingDrivers: boolean;
  timeRange: string;
  dateRange: DateRange | undefined;
}

export function ReportsTabs({
  activeTab,
  setActiveTab,
  vehiclesData,
  fuelData,
  maintenanceData,
  tripsData,
  driversData,
  isLoadingVehicles,
  isLoadingFuel,
  isLoadingMaintenance,
  isLoadingTrips,
  isLoadingDrivers,
  timeRange,
  dateRange
}: ReportsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-2 md:grid-cols-6 mb-4">
        {reportTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            {tab.icon}
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="vehicles" className="space-y-4">
        <VehiclesReport
          vehiclesData={vehiclesData}
          isLoading={isLoadingVehicles}
        />
      </TabsContent>

      <TabsContent value="fuel" className="space-y-4">
        <FuelReport
          fuelData={fuelData}
          isLoading={isLoadingFuel}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="maintenance" className="space-y-4">
        <MaintenanceReport
          maintenanceData={maintenanceData}
          isLoading={isLoadingMaintenance}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="trips" className="space-y-4">
        <TripsReport
          tripsData={tripsData}
          isLoading={isLoadingTrips}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="drivers" className="space-y-4">
        <DriversReport
          driversData={driversData}
          isLoading={isLoadingDrivers}
        />
      </TabsContent>

      <TabsContent value="financial" className="space-y-4">
        <FinancialReport
          tripsData={tripsData}
          maintenanceData={maintenanceData}
          fuelData={fuelData}
          isLoadingTrips={isLoadingTrips}
          isLoadingMaintenance={isLoadingMaintenance}
          isLoadingFuel={isLoadingFuel}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>
    </Tabs>
  );
}
