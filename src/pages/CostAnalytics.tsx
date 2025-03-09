
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OverviewTab } from "@/components/cost-analytics/OverviewTab";
import { CategoriesTab } from "@/components/cost-analytics/CategoriesTab";
import { VehiclesTab } from "@/components/cost-analytics/VehiclesTab";
import { DetailsTab } from "@/components/cost-analytics/DetailsTab";
import { ComparisonTab } from "@/components/cost-analytics/ComparisonTab";
import { useCostAnalyticsData } from "@/hooks/use-cost-analytics-data";
import { useCostDataCalculations } from "@/hooks/use-cost-data-calculations";
import { calculateFinancialData } from "@/lib/financial-calculations";
import { AlertCircle, Loader, TrendingDown, TrendingUp, DollarSign, Wrench, Fuel, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CostAnalytics = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState("overview");
  
  const { 
    maintenanceData, 
    fuelData,
    tripsData,
    sparePartsData,
    comparisonMaintenanceData, 
    comparisonFuelData,
    comparisonTripsData,
    comparisonSparePartsData,
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
    sparePartsData,
    comparisonMaintenanceData, 
    comparisonFuelData,
    comparisonSparePartsData,
    selectedYear,
    comparisonYear
  );

  const financialData = calculateFinancialData(
    tripsData || [],
    maintenanceData || [],
    fuelData || [],
    sparePartsData || []
  );

  const comparisonFinancialData = comparisonYear ? calculateFinancialData(
    comparisonTripsData || [],
    comparisonMaintenanceData || [],
    comparisonFuelData || [],
    comparisonSparePartsData || []
  ) : null;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    if (activeTab === "comparison" && !comparisonYear) {
      setActiveTab("overview");
    }
  }, [activeTab, comparisonYear]);

  const handleComparisonYearChange = (value: string) => {
    setComparisonYear(value === "none" ? null : value);
  };

  const calculateProfitTrend = () => {
    if (!monthlyData || monthlyData.length < 2) return { trend: 0, isPositive: true };
    
    let currentMonthIndex = new Date().getMonth();
    let previousMonthIndex = currentMonthIndex > 0 ? currentMonthIndex - 1 : 11;
    
    if (!monthlyData[currentMonthIndex].total && !monthlyData[previousMonthIndex].total) {
      const monthsWithData = monthlyData
        .map((data, index) => ({ index, total: data.total }))
        .filter(m => m.total > 0)
        .sort((a, b) => b.index - a.index);
      
      if (monthsWithData.length >= 2) {
        currentMonthIndex = monthsWithData[0].index;
        previousMonthIndex = monthsWithData[1].index;
      }
    }
    
    const currentMonthRevenue = financialData.monthlyData.find(
      m => m.month.includes(monthlyData[currentMonthIndex].month)
    )?.revenue || 0;
    
    const previousMonthRevenue = financialData.monthlyData.find(
      m => m.month.includes(monthlyData[previousMonthIndex].month)
    )?.revenue || 0;
    
    const currentProfit = currentMonthRevenue - monthlyData[currentMonthIndex].total;
    const previousProfit = previousMonthRevenue - monthlyData[previousMonthIndex].total;
    
    if (previousProfit === 0) return { trend: currentProfit > 0 ? 100 : 0, isPositive: currentProfit > 0 };
    
    const trend = ((currentProfit - previousProfit) / Math.abs(previousProfit)) * 100;
    return { trend, isPositive: trend >= 0 };
  };

  const profitTrend = calculateProfitTrend();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Revenue & Expense Analytics</h1>
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

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading data...</span>
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                Revenue
              </CardTitle>
              <CardDescription>Total trip revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${financialData.totalRevenue.toFixed(2)}
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-muted-foreground">
                  From {financialData.tripCount} trips
                </div>
                <div className="text-xs">
                  Avg: ${financialData.averageTripRevenue.toFixed(2)}/trip
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Wrench className="h-5 w-5 mr-2 text-red-500" />
                <span>Expenses</span>
              </CardTitle>
              <CardDescription>Breakdown of all expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${financialData.totalExpenses.toFixed(2)}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="flex items-center">
                  <Wrench className="h-4 w-4 mr-1 text-blue-500" />
                  <span className="text-xs">
                    Maintenance: ${summaryCosts.maintenance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Fuel className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="text-xs">
                    Fuel: ${summaryCosts.fuel.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-1 text-purple-500" />
                  <span className="text-xs">
                    Parts: ${financialData.expenseBreakdown.spareParts.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={financialData.profit >= 0 ? "border-green-500" : "border-red-500"}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                {financialData.profit >= 0 ? (
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
                )}
                <span>Profit</span>
              </CardTitle>
              <CardDescription>Revenue minus expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${financialData.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${financialData.profit.toFixed(2)}
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-muted-foreground">
                  {financialData.totalRevenue > 0 ? 
                    `Margin: ${financialData.profitMargin.toFixed(1)}%` : 
                    "No revenue recorded"}
                </div>
                {profitTrend.trend !== 0 && (
                  <div className={`flex items-center text-xs ${profitTrend.isPositive ? "text-green-600" : "text-red-600"}`}>
                    {profitTrend.isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(profitTrend.trend).toFixed(1)}% from previous month
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && (!vehicleCosts || vehicleCosts.length === 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There is no expense or revenue data available for the selected year. Please try selecting a different year or add some data.
          </AlertDescription>
        </Alert>
      )}

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
