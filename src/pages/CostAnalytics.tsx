
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
import { calculateFinancialData } from "@/lib/financial-calculations";
import { AlertCircle, Loader } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CostAnalytics = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use our custom hooks to fetch and process data
  const { 
    maintenanceData, 
    fuelData,
    tripsData,
    comparisonMaintenanceData, 
    comparisonFuelData,
    comparisonTripsData,
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

  // Calculate financial data (revenue, profit)
  const financialData = calculateFinancialData(
    tripsData || [],
    maintenanceData || [],
    fuelData || []
  );

  // Calculate comparison financial data if needed
  const comparisonFinancialData = comparisonYear ? calculateFinancialData(
    comparisonTripsData || [],
    comparisonMaintenanceData || [],
    comparisonFuelData || []
  ) : null;

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
        <h1 className="text-3xl font-bold tracking-tight">Revenue & Cost Analytics</h1>
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
                <SelectValue placeholder="Select year" />
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
          <span className="ml-2 text-lg">Loading data...</span>
        </div>
      )}

      {/* Revenue & Cost Summary */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Revenue</CardTitle>
              <CardDescription>Total trip revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${financialData.totalRevenue.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                From {financialData.tripCount} trips
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Expenses</CardTitle>
              <CardDescription>Total costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${financialData.totalExpenses.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                Maintenance & fuel
              </div>
            </CardContent>
          </Card>
          
          <Card className={financialData.profit >= 0 ? "border-green-500" : "border-red-500"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Profit</CardTitle>
              <CardDescription>Revenue minus expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${financialData.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${financialData.profit.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {financialData.totalRevenue > 0 ? 
                  `Margin: ${financialData.profitMargin.toFixed(1)}%` : 
                  "No revenue recorded"}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Costs</CardTitle>
              <CardDescription>Breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summaryCosts.total.toFixed(2)}
              </div>
              <div className="grid grid-cols-2 text-xs text-muted-foreground gap-1">
                <div>Maintenance: ${summaryCosts.maintenance.toFixed(2)}</div>
                <div>Fuel: ${summaryCosts.fuel.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error state if no data available */}
      {!isLoading && (!vehicleCosts || vehicleCosts.length === 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There is no cost or revenue data available for the selected year. Please try selecting a different year or add some data.
          </AlertDescription>
        </Alert>
      )}

      {/* Cost data tabs */}
      {!isLoading && vehicleCosts && vehicleCosts.length > 0 && (
        <>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
              <TabsTrigger value="details">Detailed Records</TabsTrigger>
              {comparisonYear && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
            </TabsList>

            {/* Tab Contents */}
            {monthlyData && <OverviewTab monthlyData={monthlyData} />}
            {maintenanceCategories && fuelTypes && <CategoriesTab maintenanceCategories={maintenanceCategories} fuelTypes={fuelTypes} />}
            {vehicleCosts && <VehiclesTab vehicleCosts={vehicleCosts} />}
            {vehicleCosts && <DetailsTab vehicleCosts={vehicleCosts} />}
            {comparisonYear && yearComparison && <ComparisonTab comparisonData={yearComparison} />}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CostAnalytics;
