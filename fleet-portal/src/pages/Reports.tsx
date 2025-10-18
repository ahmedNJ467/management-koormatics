import { useState } from "react";
import { ReportsHeader } from "@/components/reports/ReportsHeader";
import { ReportsTabs } from "@/components/reports/ReportsTabs";
import { useReportsData } from "@/components/reports/hooks/useReportsData";
import { useReportFilters } from "@/components/reports/hooks/useReportFilters";

export default function Reports() {
  const {
    vehicles: vehiclesData,
    fuelData,
    maintenanceData,
    tripsData,
    driversData,
    sparePartsData,
    isLoadingVehicles,
    isLoadingFuel,
    isLoadingMaintenance,
    isLoadingTrips,
    isLoadingDrivers,
    isLoadingSpareparts,
  } = useReportsData();

  const {
    activeTab,
    setActiveTab,
    timeRange,
    setTimeRange,
    dateRange,
    setDateRange,
    handleDateRangeChange,
    clearDateRange,
  } = useReportFilters();

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        <div className="border-b border-border pb-4 pt-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          </div>
        </div>

        <ReportsHeader
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          dateRange={dateRange}
          handleDateRangeChange={handleDateRangeChange}
          clearDateRange={clearDateRange}
        />

        <ReportsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          vehiclesData={vehiclesData}
          fuelData={fuelData}
          maintenanceData={maintenanceData}
          tripsData={tripsData}
          driversData={driversData}
          sparePartsData={sparePartsData}
          isLoadingVehicles={isLoadingVehicles}
          isLoadingFuel={isLoadingFuel}
          isLoadingMaintenance={isLoadingMaintenance}
          isLoadingTrips={isLoadingTrips}
          isLoadingDrivers={isLoadingDrivers}
          isLoadingSpareparts={isLoadingSpareparts}
          timeRange={timeRange}
          dateRange={dateRange}
        />
      </div>
    </div>
  );
}
