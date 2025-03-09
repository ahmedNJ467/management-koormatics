
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehiclesReport } from "./tabs/VehiclesReport";
import { TripsReport } from "./tabs/TripsReport";
import { MaintenanceReport } from "./tabs/MaintenanceReport";
import { FuelReport } from "./tabs/FuelReport";
import { DriversReport } from "./tabs/DriversReport";
import { FinancialReport } from "./tabs/FinancialReport";
import { DateRange } from "react-day-picker";

interface ReportsTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  vehiclesData: any[];
  tripsData: any[];
  maintenanceData: any[];
  fuelData: any[];
  driversData: any[];
  sparePartsData: any[];
  isLoadingVehicles: boolean;
  isLoadingTrips: boolean;
  isLoadingMaintenance: boolean;
  isLoadingFuel: boolean;
  isLoadingDrivers: boolean;
  isLoadingSpareparts: boolean;
  timeRange: string;
  dateRange: DateRange | undefined;
}

export function ReportsTabs({
  activeTab,
  setActiveTab,
  vehiclesData,
  tripsData,
  maintenanceData,
  fuelData,
  driversData,
  sparePartsData,
  isLoadingVehicles,
  isLoadingTrips,
  isLoadingMaintenance,
  isLoadingFuel,
  isLoadingDrivers,
  isLoadingSpareparts,
  timeRange,
  dateRange,
}: ReportsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="trips">Trips</TabsTrigger>
        <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="fuel">Fuel</TabsTrigger>
        <TabsTrigger value="drivers">Drivers</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
      </TabsList>

      <TabsContent value="trips">
        <TripsReport 
          tripsData={tripsData} 
          isLoading={isLoadingTrips}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="vehicles">
        <VehiclesReport 
          vehiclesData={vehiclesData} 
          isLoading={isLoadingVehicles}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="maintenance">
        <MaintenanceReport 
          maintenanceData={maintenanceData} 
          isLoading={isLoadingMaintenance}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="fuel">
        <FuelReport 
          fuelData={fuelData} 
          isLoading={isLoadingFuel}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="drivers">
        <DriversReport 
          driversData={driversData} 
          isLoading={isLoadingDrivers}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="financial">
        <FinancialReport 
          tripsData={tripsData}
          maintenanceData={maintenanceData}
          fuelData={fuelData}
          sparePartsData={sparePartsData}
          isLoadingTrips={isLoadingTrips}
          isLoadingMaintenance={isLoadingMaintenance}
          isLoadingFuel={isLoadingFuel}
          isLoadingSpareparts={isLoadingSpareparts}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>
    </Tabs>
  );
}
