import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FinancialReport } from "@/components/reports/tabs/FinancialReport";
import { TripsReport } from "@/components/reports/tabs/TripsReport";
import { VehiclesReport } from "@/components/reports/tabs/VehiclesReport";
import { MaintenanceReport } from "@/components/reports/tabs/MaintenanceReport";
import { FuelReport } from "@/components/reports/tabs/FuelReport";
import { DriversReport } from "@/components/reports/tabs/DriversReport";
import { DateRange } from "react-day-picker";

interface ReportsTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  vehiclesData: any[] | undefined;
  fuelData: any[] | undefined;
  maintenanceData: any[] | undefined;
  tripsData: any[] | undefined;
  driversData: any[] | undefined;
  sparePartsData?: any[] | undefined;
  isLoadingVehicles: boolean;
  isLoadingFuel: boolean;
  isLoadingMaintenance: boolean;
  isLoadingTrips: boolean;
  isLoadingDrivers: boolean;
  isLoadingSpareparts?: boolean;
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
  sparePartsData = [],
  isLoadingVehicles,
  isLoadingFuel,
  isLoadingMaintenance,
  isLoadingTrips,
  isLoadingDrivers,
  isLoadingSpareparts = false,
  timeRange,
  dateRange
}: ReportsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="trips">Trips</TabsTrigger>
        <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="fuel">Fuel</TabsTrigger>
        <TabsTrigger value="drivers">Drivers</TabsTrigger>
      </TabsList>
      
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
      
      <TabsContent value="trips">
        <TripsReport 
          tripsData={tripsData}
          isLoadingTrips={isLoadingTrips}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>
      
      <TabsContent value="vehicles">
        <VehiclesReport 
          vehiclesData={vehiclesData}
          isLoadingVehicles={isLoadingVehicles}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>
      
      <TabsContent value="maintenance">
        <MaintenanceReport 
          maintenanceData={maintenanceData}
          isLoadingMaintenance={isLoadingMaintenance}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>
      
      <TabsContent value="fuel">
        <FuelReport 
          fuelData={fuelData}
          isLoadingFuel={isLoadingFuel}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>
      
      <TabsContent value="drivers">
        <DriversReport 
          driversData={driversData}
          isLoadingDrivers={isLoadingDrivers}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </TabsContent>
    </Tabs>
  );
}
