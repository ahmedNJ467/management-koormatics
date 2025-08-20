
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCombinedFinancialData } from "@/hooks/use-combined-financial-data";
import { CombinedSummaryCards } from "@/components/combined-analytics/CombinedSummaryCards";
import { CombinedOverviewTab } from "@/components/combined-analytics/CombinedOverviewTab";
import { VehicleProfitTab } from "@/components/combined-analytics/VehicleProfitTab";
import { DetailsTab } from "@/components/cost-analytics/DetailsTab";
import { ComparisonTab } from "@/components/cost-analytics/ComparisonTab";
import { CategoriesTab } from "@/components/cost-analytics/CategoriesTab";
import { AlertCircle, Loader } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CombinedAnalytics = () => {
  const { 
    combinedData,
    isLoading,
    selectedYear,
    setSelectedYear,
    activeTab,
    setActiveTab,
    yearOptions,
    comparisonYear,
    setComparisonYear
  } = useCombinedFinancialData();

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
        <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>
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
          <span className="ml-2 text-lg">Loading financial data...</span>
        </div>
      )}

      {/* Error state if no data available */}
      {!isLoading && (!combinedData.profitAnalytics.vehicleProfits || combinedData.profitAnalytics.vehicleProfits.length === 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There is no financial data available for the selected year. Please try selecting a different year or add some data.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {!isLoading && combinedData.profitAnalytics.vehicleProfits && combinedData.profitAnalytics.vehicleProfits.length > 0 && (
        <>
          <CombinedSummaryCards data={combinedData} selectedYear={selectedYear} />

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicle Profit</TabsTrigger>
              <TabsTrigger value="categories">Cost Categories</TabsTrigger>
              <TabsTrigger value="details">Detailed Records</TabsTrigger>
              {comparisonYear && <TabsTrigger value="comparison">Year Comparison</TabsTrigger>}
            </TabsList>

            {/* Tab Contents */}
            <TabsContent value="overview">
              <CombinedOverviewTab data={combinedData} />
            </TabsContent>
            
            <TabsContent value="vehicles">
              <VehicleProfitTab data={combinedData} />
            </TabsContent>
            
            <TabsContent value="categories">
              <CategoriesTab 
                maintenanceCategories={combinedData.costAnalytics.maintenanceCategories} 
                fuelTypes={combinedData.costAnalytics.fuelTypes} 
              />
            </TabsContent>
            
            <TabsContent value="details">
              <DetailsTab vehicleCosts={combinedData.costAnalytics.vehicleCosts} />
            </TabsContent>
            
            {comparisonYear && (
              <TabsContent value="comparison">
                <ComparisonTab comparisonData={combinedData.costAnalytics.yearComparison} />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CombinedAnalytics;
