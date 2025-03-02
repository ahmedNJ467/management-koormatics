
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CostSummaryCards } from "@/components/cost-analytics/CostSummaryCards";
import { OverviewTab } from "@/components/cost-analytics/OverviewTab";
import { CategoriesTab } from "@/components/cost-analytics/CategoriesTab";
import { VehiclesTab } from "@/components/cost-analytics/VehiclesTab";
import { DetailsTab } from "@/components/cost-analytics/DetailsTab";
import { useCostAnalyticsData } from "@/hooks/use-cost-analytics-data";
import { useCostDataCalculations } from "@/hooks/use-cost-data-calculations";

const CostAnalytics = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Use our custom hooks to fetch and process data
  const { maintenanceData, fuelData, isLoading, yearOptions } = useCostAnalyticsData(selectedYear);
  const { summaryCosts, monthlyData, vehicleCosts, maintenanceCategories, fuelTypes } = 
    useCostDataCalculations(maintenanceData, fuelData);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Cost Analytics</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Year:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={selectedYear} />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cost Summary Cards */}
      <CostSummaryCards summaryCosts={summaryCosts} selectedYear={selectedYear} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
          <TabsTrigger value="details">Detailed Records</TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <OverviewTab monthlyData={monthlyData} />
        <CategoriesTab maintenanceCategories={maintenanceCategories} fuelTypes={fuelTypes} />
        <VehiclesTab vehicleCosts={vehicleCosts} />
        <DetailsTab vehicleCosts={vehicleCosts} />
      </Tabs>
    </div>
  );
};

export default CostAnalytics;
