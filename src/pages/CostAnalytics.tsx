
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CostSummaryCards } from "@/components/cost-analytics/CostSummaryCards";
import { OverviewTab } from "@/components/cost-analytics/OverviewTab";
import { CategoriesTab } from "@/components/cost-analytics/CategoriesTab";
import { VehiclesTab } from "@/components/cost-analytics/VehiclesTab";
import { DetailsTab } from "@/components/cost-analytics/DetailsTab";
import { ComparisonTab } from "@/components/cost-analytics/ComparisonTab";
import { useCostAnalyticsData } from "@/hooks/use-cost-analytics-data";
import { useCostDataCalculations } from "@/hooks/use-cost-data-calculations";
import { AlertCircle, Loader } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CostAnalytics = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use our custom hooks to fetch and process data
  const { 
    maintenanceData, 
    fuelData, 
    comparisonMaintenanceData, 
    comparisonFuelData,
    isLoading, 
    yearOptions,
    comparisonYear,
    setComparisonYear
  } = useCostAnalyticsData(selectedYear);
  
  const { 
    summaryCosts, 
    monthlyData, 
    vehicleCosts, 
    maintenanceCategories, 
    fuelTypes,
    yearComparison
  } = useCostDataCalculations(
    maintenanceData, 
    fuelData, 
    comparisonMaintenanceData, 
    comparisonFuelData,
    selectedYear,
    comparisonYear
  );

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // If comparison tab is active but comparison year is removed, switch to overview
  useEffect(() => {
    if (activeTab === "comparison" && !comparisonYear) {
      setActiveTab("overview");
    }
  }, [activeTab, comparisonYear]);

  const handleComparisonYearChange = (value: string) => {
    setComparisonYear(value === "none" ? null : value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Cost Analytics</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Compare with:</span>
            <Select 
              value={comparisonYear || "none"} 
              onValueChange={handleComparisonYearChange}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {yearOptions
                  .filter(year => year !== selectedYear)
                  .map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={selectedYear} />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading cost data...</span>
        </div>
      )}

      {/* Error state if no data available */}
      {!isLoading && vehicleCosts.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There is no cost data available for the selected year. Please try selecting a different year or add some cost data.
          </AlertDescription>
        </Alert>
      )}

      {/* Cost Summary Cards */}
      {!isLoading && vehicleCosts.length > 0 && (
        <>
          <CostSummaryCards summaryCosts={summaryCosts} selectedYear={selectedYear} />

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
              <TabsTrigger value="details">Detailed Records</TabsTrigger>
              {comparisonYear && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
            </TabsList>

            {/* Tab Contents */}
            <OverviewTab monthlyData={monthlyData} />
            <CategoriesTab maintenanceCategories={maintenanceCategories} fuelTypes={fuelTypes} />
            <VehiclesTab vehicleCosts={vehicleCosts} />
            <DetailsTab vehicleCosts={vehicleCosts} />
            {comparisonYear && <ComparisonTab comparisonData={yearComparison} />}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CostAnalytics;
