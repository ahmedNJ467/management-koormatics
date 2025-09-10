import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader,
  DollarSign,
  Wrench,
  Fuel,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCostAnalyticsData } from "@/hooks/use-cost-analytics-data";
import { useCostDataCalculations } from "@/hooks/use-cost-data-calculations";
import {
  calculateFinancialData,
  testFinancialCalculations,
} from "@/lib/financial-calculations";
import { OverviewTab } from "@/components/cost-analytics/OverviewTab";
import { VehiclesTab } from "@/components/cost-analytics/VehiclesTab";
import { ComparisonTab } from "@/components/cost-analytics/ComparisonTab";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CostAnalytics = () => {
  // Test calculations on component mount
  useEffect(() => {
    console.log("Testing financial calculations...");
    testFinancialCalculations();
  }, []);

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
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
    setComparisonYear,
  } = useCostAnalyticsData(selectedYear);

  const { summaryCosts, monthlyData, vehicleCosts, yearComparison } =
    useCostDataCalculations(
      maintenanceData,
      fuelData,
      sparePartsData,
      comparisonMaintenanceData,
      comparisonFuelData,
      comparisonSparePartsData,
      selectedYear,
      comparisonYear
    );

  // Validate data before calculations
  const validTripsData = Array.isArray(tripsData) ? tripsData : [];
  const validMaintenanceData = Array.isArray(maintenanceData)
    ? maintenanceData
    : [];
  const validFuelData = Array.isArray(fuelData) ? fuelData : [];
  const validSparePartsData = Array.isArray(sparePartsData)
    ? sparePartsData
    : [];

  const financialData = calculateFinancialData(
    validTripsData,
    validMaintenanceData,
    validFuelData,
    validSparePartsData
  );

  const comparisonFinancialData = comparisonYear
    ? calculateFinancialData(
        Array.isArray(comparisonTripsData) ? comparisonTripsData : [],
        Array.isArray(comparisonMaintenanceData)
          ? comparisonMaintenanceData
          : [],
        Array.isArray(comparisonFuelData) ? comparisonFuelData : [],
        Array.isArray(comparisonSparePartsData) ? comparisonSparePartsData : []
      )
    : null;

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
    if (!monthlyData || monthlyData.length < 2)
      return { trend: 0, isPositive: true };

    let currentMonthIndex = new Date().getMonth();
    let previousMonthIndex = currentMonthIndex > 0 ? currentMonthIndex - 1 : 11;

    if (
      !monthlyData[currentMonthIndex]?.total &&
      !monthlyData[previousMonthIndex]?.total
    ) {
      const monthsWithData = monthlyData
        .map((data, index) => ({ index, total: data.total }))
        .filter((m) => m.total > 0)
        .sort((a, b) => b.index - a.index);

      if (monthsWithData.length >= 2) {
        currentMonthIndex = monthsWithData[0].index;
        previousMonthIndex = monthsWithData[1].index;
      }
    }

    const currentMonthRevenue =
      financialData.monthlyData.find((m) =>
        m.month.includes(monthlyData[currentMonthIndex]?.month || "")
      )?.revenue || 0;

    const previousMonthRevenue =
      financialData.monthlyData.find((m) =>
        m.month.includes(monthlyData[previousMonthIndex]?.month || "")
      )?.revenue || 0;

    const currentMonthExpenses = monthlyData[currentMonthIndex]?.total || 0;
    const previousMonthExpenses = monthlyData[previousMonthIndex]?.total || 0;

    const currentMonthProfit = currentMonthRevenue - currentMonthExpenses;
    const previousMonthProfit = previousMonthRevenue - previousMonthExpenses;

    if (previousMonthProfit === 0) return { trend: 0, isPositive: true };

    const trend =
      ((currentMonthProfit - previousMonthProfit) /
        Math.abs(previousMonthProfit)) *
      100;
    return { trend, isPositive: trend >= 0 };
  };

  const profitTrend = calculateProfitTrend();

  // Debug logging
  console.log("CostAnalytics - Raw Data Counts:", {
    trips: validTripsData.length,
    maintenance: validMaintenanceData.length,
    fuel: validFuelData.length,
    spareParts: validSparePartsData.length,
  });

  console.log("CostAnalytics - Summary Costs:", summaryCosts);
  console.log("CostAnalytics - Financial Data:", financialData);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Analytics
              </h1>
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center">
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
                    .filter((year) => year !== selectedYear)
                    .map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
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
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
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
              <div className="grid grid-cols-2 gap-2 mt-2">
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
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                *Maintenance costs include parts used from inventory
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              financialData.profit >= 0 ? "border-green-500" : "border-red-500"
            }
          >
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
              <div
                className={`text-2xl font-bold ${
                  financialData.profit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${financialData.profit.toFixed(2)}
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-muted-foreground">
                  {financialData.totalRevenue > 0
                    ? `Margin: ${financialData.profitMargin.toFixed(1)}%`
                    : "No revenue recorded"}
                </div>
                {profitTrend.trend !== 0 && (
                  <div
                    className={`flex items-center text-xs ${
                      profitTrend.isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {profitTrend.isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(profitTrend.trend).toFixed(1)}% from previous
                    month
                  </div>
                )}
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
                <div className="grid grid-cols-2 gap-2 mt-2">
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
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  *Maintenance costs include parts used from inventory
                </div>
              </CardContent>
            </Card>

            <Card
              className={
                financialData.profit >= 0
                  ? "border-green-500"
                  : "border-red-500"
              }
            >
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
                <div
                  className={`text-2xl font-bold ${
                    financialData.profit >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${financialData.profit.toFixed(2)}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-muted-foreground">
                    {financialData.totalRevenue > 0
                      ? `Margin: ${financialData.profitMargin.toFixed(1)}%`
                      : "No revenue recorded"}
                  </div>
                  {profitTrend.trend !== 0 && (
                    <div
                      className={`flex items-center text-xs ${
                        profitTrend.isPositive
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {profitTrend.isPositive ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(profitTrend.trend).toFixed(1)}% from previous
                      month
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
              There is no expense or revenue data available for the selected
              year. Please try selecting a different year or add some data.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && vehicleCosts && vehicleCosts.length > 0 && (
          <>
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="space-y-4"
            >
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
                <TabsTrigger value="spare-parts">
                  Spare Parts Analysis
                </TabsTrigger>
                {comparisonYear && (
                  <TabsTrigger value="comparison">Comparison</TabsTrigger>
                )}
              </TabsList>
            
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        $
                        {validSparePartsData
                          .reduce((sum, part) => {
                            const quantity = Number(part.quantity || 0);
                            const costPerUnit = Number(part.unit_price || 0);
                            return sum + quantity * costPerUnit;
                          }, 0)
                          .toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Inventory Value
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {validSparePartsData.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Parts
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {
                          validSparePartsData.filter(
                            (p) => Number(p.quantity || 0) > 0
                          ).length
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        In Stock
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {
                          validSparePartsData.filter(
                            (p) =>
                              Number(p.quantity || 0) <=
                              Number(p.min_stock_level || 5)
                          ).length
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Low Stock
                      </div>
                    </div>
                  </div>

                  {/* Inventory Overview */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium">Current Inventory</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {validSparePartsData.map((part, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            Number(part.quantity || 0) <=
                              Number(part.min_stock_level || 5)
                              ? "border-orange-300 bg-orange-50 dark:bg-orange-950"
                              : Number(part.quantity || 0) === 0
                              ? "border-red-300 bg-red-50 dark:bg-red-950"
                              : "border-gray-200 bg-gray-50 dark:bg-gray-800"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-sm">
                              {part.name}
                            </div>
                            <div
                              className={`text-xs px-2 py-1 rounded-full ${
                                part.status === "in_stock"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : part.status === "low_stock"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {part.status?.replace("_", " ")}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {part.manufacturer} • {part.category}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm">
                              <span className="font-medium">
                                {part.quantity || 0}
                              </span>{" "}
                              units
                              {part.min_stock_level && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  (min: {part.min_stock_level})
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium">
                              $
                              {(
                                Number(part.quantity || 0) *
                                Number(part.unit_price || 0)
                              ).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ${Number(part.unit_price || 0).toFixed(2)} per unit
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Purchases */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Monthly Purchase Analysis</h4>
                    <div className="space-y-3">
                      {(() => {
                        // Group parts by purchase month
                        const monthlyPurchases: Record<string, any[]> = {};

                        validSparePartsData.forEach((part) => {
                          if (part.purchase_date) {
                            try {
                              const date = new Date(part.purchase_date);
                              if (!isNaN(date.getTime())) {
                                const monthKey = `${date.getFullYear()}-${String(
                                  date.getMonth() + 1
                                ).padStart(2, "0")}`;
                                const monthName = date.toLocaleString(
                                  "default",
                                  { month: "short", year: "numeric" }
                                );

                                if (!monthlyPurchases[monthKey]) {
                                  monthlyPurchases[monthKey] = [];
                                }

                                monthlyPurchases[monthKey].push({
                                  ...part,
                                  monthName,
                                });
                              }
                            } catch (error) {
                              console.warn(
                                "Error processing purchase date:",
                                part.purchase_date
                              );
                            }
                          }
                        });

                        const sortedMonths = Object.entries(
                          monthlyPurchases
                        ).sort(([a], [b]) => b.localeCompare(a));

                        if (sortedMonths.length === 0) {
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              No purchase data available for the selected period
                            </div>
                          );
                        }

                        return sortedMonths.map(([monthKey, parts]) => {
                          const totalCost = parts.reduce((sum, part) => {
                            const quantity = Number(part.quantity || 0);
                            const costPerUnit = Number(part.unit_price || 0);
                            return sum + quantity * costPerUnit;
                          }, 0);

                          return (
                            <div
                              key={monthKey}
                              className="p-4 bg-muted rounded-lg"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <h5 className="font-medium">
                                  {parts[0].monthName}
                                </h5>
                                <div className="text-sm font-medium">
                                  Total: ${totalCost.toFixed(2)}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {parts.map((part, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center text-sm"
                                  >
                                    <span>{part.name}</span>
                                    <span className="text-muted-foreground">
                                      {part.quantity || 0} × $
                                      {Number(part.unit_price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="space-y-6 mt-8">
                    <h4 className="font-medium">Analytics & Charts</h4>
                    
                    {/* Inventory Value Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Top 10 Parts by Value</CardTitle>
                          <CardDescription>Highest value inventory items</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={validSparePartsData
                                .map(part => ({
                                  name: part.name.length > 15 ? part.name.substring(0, 15) + '...' : part.name,
                                  value: Number(part.quantity || 0) * Number(part.unit_price || 0),
                                  quantity: Number(part.quantity || 0)
                                }))
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 10)
                              }
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                              <YAxis />
                              <Tooltip 
                                formatter={(value, name) => [`$${Number(value).toFixed(2)}`, 'Total Value']}
                                labelFormatter={(label) => `${label} (${validSparePartsData.find(p => p.name.startsWith(label.replace('...', '')))?.quantity || 0} units)`}
                              />
                              <Bar dataKey="value" fill="#8b5cf6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Stock Levels Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Stock Levels Overview</CardTitle>
                          <CardDescription>Current quantity vs minimum stock levels</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={validSparePartsData
                                .filter(part => Number(part.quantity || 0) > 0)
                                .map(part => ({
                                  name: part.name.length > 12 ? part.name.substring(0, 12) + '...' : part.name,
                                  current: Number(part.quantity || 0),
                                  minimum: Number(part.min_stock_level || 5)
                                }))
                                .slice(0, 8)
                              }
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="current" fill="#10b981" name="Current Stock" />
                              <Bar dataKey="minimum" fill="#f59e0b" name="Minimum Level" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Monthly Purchases Trend */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Monthly Purchase Trends</CardTitle>
                        <CardDescription>Spending on spare parts over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={(() => {
                              const monthlyPurchases: Record<string, number> = {};
                              
                              validSparePartsData.forEach(part => {
                                if (part.purchase_date) {
                                  try {
                                    const date = new Date(part.purchase_date);
                                    if (!isNaN(date.getTime())) {
                                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                                      
                                      if (!monthlyPurchases[monthKey]) {
                                        monthlyPurchases[monthKey] = 0;
                                      }
                                      
                                      monthlyPurchases[monthKey] += Number(part.quantity || 0) * Number(part.unit_price || 0);
                                    }
                                  } catch (error) {
                                    console.warn('Error processing purchase date:', part.purchase_date);
                                  }
                                }
                              });

                              return Object.entries(monthlyPurchases)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([monthKey, total]) => {
                                  const [year, month] = monthKey.split('-');
                                  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
                                  return { month: monthName, total: Number(total.toFixed(2)) };
                                });
                            })()}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}`, 'Total Spent']} />
                            <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Category Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Parts by Category</CardTitle>
                          <CardDescription>Distribution of parts across categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={(() => {
                                  const categoryCounts: Record<string, number> = {};
                                  validSparePartsData.forEach(part => {
                                    const category = part.category || 'Uncategorized';
                                    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                                  });
                                  
                                  return Object.entries(categoryCounts).map(([category, count]) => ({
                                    name: category,
                                    value: count
                                  }));
                                })()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {(() => {
                                  const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899'];
                                  const categoryCounts: Record<string, number> = {};
                                  validSparePartsData.forEach(part => {
                                    const category = part.category || 'Uncategorized';
                                    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                                  });
                                  return Object.entries(categoryCounts).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                  ));
                                })()}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {validSparePartsData.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Parts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {
                            validSparePartsData.filter(
                              (p) => Number(p.quantity || 0) > 0
                            ).length
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          In Stock
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {
                            validSparePartsData.filter(
                              (p) =>
                                Number(p.quantity || 0) <=
                                Number(p.min_stock_level || 5)
                            ).length
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Low Stock
                        </div>
                      </div>
                    </div>

                    {/* Inventory Overview */}
                    <div className="space-y-4 mb-6">
                      <h4 className="font-medium">Current Inventory</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {validSparePartsData.map((part, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              Number(part.quantity || 0) <=
                              Number(part.min_stock_level || 5)
                                ? "border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/20"
                                : Number(part.quantity || 0) === 0
                                ? "border-red-500/30 bg-red-500/10 dark:bg-red-500/20"
                                : "border-border bg-muted"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-sm">
                                {part.name}
                              </div>
                              <div
                                className={`text-xs px-2 py-1 rounded-full ${
                                  part.status === "in_stock"
                                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                                    : part.status === "low_stock"
                                    ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                                    : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                                }`}
                              >
                                {part.status?.replace("_", " ")}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {part.manufacturer} • {part.category}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="font-medium">
                                  {part.quantity || 0}
                                </span>{" "}
                                units
                                {part.min_stock_level && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    (min: {part.min_stock_level})
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-medium">
                                $
                                {(
                                  Number(part.quantity || 0) *
                                  Number(part.unit_price || 0)
                                ).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              ${Number(part.unit_price || 0).toFixed(2)} per
                              unit
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Purchases */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Monthly Purchase Analysis</h4>
                      <div className="space-y-3">
                        {(() => {
                          // Group parts by purchase month
                          const monthlyPurchases: Record<string, any[]> = {};

                          validSparePartsData.forEach((part) => {
                            if (part.purchase_date) {
                              try {
                                const date = new Date(part.purchase_date);
                                if (!isNaN(date.getTime())) {
                                  const monthKey = `${date.getFullYear()}-${String(
                                    date.getMonth() + 1
                                  ).padStart(2, "0")}`;
                                  const monthName = date.toLocaleString(
                                    "default",
                                    { month: "short", year: "numeric" }
                                  );

                                  if (!monthlyPurchases[monthKey]) {
                                    monthlyPurchases[monthKey] = [];
                                  }

                                  monthlyPurchases[monthKey].push({
                                    ...part,
                                    monthName,
                                  });
                                }
                              } catch (error) {
                                console.warn(
                                  "Error processing purchase date:",
                                  part.purchase_date
                                );
                              }
                            }
                          });

                          const sortedMonths = Object.entries(
                            monthlyPurchases
                          ).sort(([a], [b]) => b.localeCompare(a));

                          if (sortedMonths.length === 0) {
                            return (
                              <div className="text-center py-8 text-muted-foreground">
                                No purchase data available for the selected
                                period
                              </div>
                            );
                          }

                          return sortedMonths.map(([monthKey, parts]) => {
                            const totalCost = parts.reduce((sum, part) => {
                              const quantity = Number(part.quantity || 0);
                              const costPerUnit = Number(part.unit_price || 0);
                              return sum + quantity * costPerUnit;
                            }, 0);

                            return (
                              <div
                                key={monthKey}
                                className="p-4 bg-muted rounded-lg"
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="font-medium">
                                    {parts[0].monthName}
                                  </h5>
                                  <div className="text-sm font-medium">
                                    Total: ${totalCost.toFixed(2)}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {parts.map((part, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center text-sm"
                                    >
                                      <span>{part.name}</span>
                                      <span className="text-muted-foreground">
                                        {part.quantity || 0} × $
                                        {Number(part.unit_price || 0).toFixed(
                                          2
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Charts Section */}
                    <div className="space-y-6 mt-8">
                      <h4 className="font-medium">Analytics & Charts</h4>

                      {/* Inventory Value Chart */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Top 10 Parts by Value
                            </CardTitle>
                            <CardDescription>
                              Highest value inventory items
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={validSparePartsData
                                  .map((part) => ({
                                    name:
                                      part.name.length > 15
                                        ? part.name.substring(0, 15) + "..."
                                        : part.name,
                                    value:
                                      Number(part.quantity || 0) *
                                      Number(part.unit_price || 0),
                                    quantity: Number(part.quantity || 0),
                                  }))
                                  .sort((a, b) => b.value - a.value)
                                  .slice(0, 10)}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <XAxis
                                  dataKey="name"
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                />
                                <YAxis />
                                <Tooltip
                                  formatter={(value, name) => [
                                    `$${Number(value).toFixed(2)}`,
                                    "Total Value",
                                  ]}
                                  labelFormatter={(label) =>
                                    `${label} (${
                                      validSparePartsData.find((p) =>
                                        p.name.startsWith(
                                          label.replace("...", "")
                                        )
                                      )?.quantity || 0
                                    } units)`
                                  }
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "6px",
                                  }}
                                />
                                <Bar dataKey="value" fill="#8b5cf6" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Stock Levels Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Stock Levels Overview
                            </CardTitle>
                            <CardDescription>
                              Current quantity vs minimum stock levels
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart
                                data={validSparePartsData
                                  .filter(
                                    (part) => Number(part.quantity || 0) > 0
                                  )
                                  .map((part) => ({
                                    name:
                                      part.name.length > 12
                                        ? part.name.substring(0, 12) + "..."
                                        : part.name,
                                    current: Number(part.quantity || 0),
                                    minimum: Number(part.min_stock_level || 5),
                                  }))
                                  .slice(0, 8)}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <XAxis
                                  dataKey="name"
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                />
                                <YAxis />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "6px",
                                  }}
                                />
                                <Bar
                                  dataKey="current"
                                  fill="#10b981"
                                  name="Current Stock"
                                />
                                <Bar
                                  dataKey="minimum"
                                  fill="#f59e0b"
                                  name="Minimum Level"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Monthly Purchases Trend */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Monthly Purchase Trends
                          </CardTitle>
                          <CardDescription>
                            Spending on spare parts over time
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                              data={(() => {
                                const monthlyPurchases: Record<string, number> =
                                  {};

                                validSparePartsData.forEach((part) => {
                                  if (part.purchase_date) {
                                    try {
                                      const date = new Date(part.purchase_date);
                                      if (!isNaN(date.getTime())) {
                                        const monthKey = `${date.getFullYear()}-${String(
                                          date.getMonth() + 1
                                        ).padStart(2, "0")}`;
                                        const monthName = date.toLocaleString(
                                          "default",
                                          { month: "short", year: "numeric" }
                                        );

                                        if (!monthlyPurchases[monthKey]) {
                                          monthlyPurchases[monthKey] = 0;
                                        }

                                        monthlyPurchases[monthKey] +=
                                          Number(part.quantity || 0) *
                                          Number(part.unit_price || 0);
                                      }
                                    } catch (error) {
                                      console.warn(
                                        "Error processing purchase date:",
                                        part.purchase_date
                                      );
                                    }
                                  }
                                });

                                return Object.entries(monthlyPurchases)
                                  .sort(([a], [b]) => a.localeCompare(b))
                                  .map(([monthKey, total]) => {
                                    const [year, month] = monthKey.split("-");
                                    const monthName = new Date(
                                      parseInt(year),
                                      parseInt(month) - 1
                                    ).toLocaleString("default", {
                                      month: "short",
                                      year: "numeric",
                                    });
                                    return {
                                      month: monthName,
                                      total: Number(total.toFixed(2)),
                                    };
                                  });
                              })()}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip
                                formatter={(value) => [
                                  `$${value}`,
                                  "Total Spent",
                                ]}
                                contentStyle={{
                                  backgroundColor: "hsl(var(--background))",
                                  borderColor: "hsl(var(--border))",
                                  borderRadius: "6px",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                              />
                            </LineChart>
>>>>>>> origin/main
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

<<<<<<< HEAD
                      {/* Status Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Inventory Status</CardTitle>
                          <CardDescription>Current status of all parts</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={(() => {
                                  const statusCounts: Record<string, number> = {};
                                  validSparePartsData.forEach(part => {
                                    const status = part.status || 'unknown';
                                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                                  });
                                  
                                  return Object.entries(statusCounts).map(([status, count]) => ({
                                    name: status.replace('_', ' '),
                                    value: count
                                  }));
                                })()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {(() => {
                                  const colors = ['#10b981', '#f59e0b', '#ef4444'];
                                  const statusCounts: Record<string, number> = {};
                                  validSparePartsData.forEach(part => {
                                    const status = part.status || 'unknown';
                                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                                  });
                                  return Object.entries(statusCounts).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                  ));
                                })()}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {comparisonYear && yearComparison && (
              <ComparisonTab comparisonData={yearComparison} />
            )}
          </Tabs>
        </>
      )}
                      {/* Category Distribution */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Parts by Category
                            </CardTitle>
                            <CardDescription>
                              Distribution of parts across categories
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={(() => {
                                    const categoryCounts: Record<
                                      string,
                                      number
                                    > = {};
                                    validSparePartsData.forEach((part) => {
                                      const category =
                                        part.category || "Uncategorized";
                                      categoryCounts[category] =
                                        (categoryCounts[category] || 0) + 1;
                                    });

                                    return Object.entries(categoryCounts).map(
                                      ([category, count]) => ({
                                        name: category,
                                        value: count,
                                      })
                                    );
                                  })()}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {(() => {
                                    const colors = [
                                      "#8b5cf6",
                                      "#10b981",
                                      "#f59e0b",
                                      "#ef4444",
                                      "#06b6d4",
                                      "#84cc16",
                                      "#f97316",
                                      "#ec4899",
                                    ];
                                    const categoryCounts: Record<
                                      string,
                                      number
                                    > = {};
                                    validSparePartsData.forEach((part) => {
                                      const category =
                                        part.category || "Uncategorized";
                                      categoryCounts[category] =
                                        (categoryCounts[category] || 0) + 1;
                                    });
                                    return Object.entries(categoryCounts).map(
                                      (entry, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={colors[index % colors.length]}
                                        />
                                      )
                                    );
                                  })()}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "6px",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Status Distribution */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              Inventory Status
                            </CardTitle>
                            <CardDescription>
                              Current status of all parts
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={(() => {
                                    const statusCounts: Record<string, number> =
                                      {};
                                    validSparePartsData.forEach((part) => {
                                      const status = part.status || "unknown";
                                      statusCounts[status] =
                                        (statusCounts[status] || 0) + 1;
                                    });

                                    return Object.entries(statusCounts).map(
                                      ([status, count]) => ({
                                        name: status.replace("_", " "),
                                        value: count,
                                      })
                                    );
                                  })()}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {(() => {
                                    const colors = [
                                      "#10b981",
                                      "#f59e0b",
                                      "#ef4444",
                                    ];
                                    const statusCounts: Record<string, number> =
                                      {};
                                    validSparePartsData.forEach((part) => {
                                      const status = part.status || "unknown";
                                      statusCounts[status] =
                                        (statusCounts[status] || 0) + 1;
                                    });
                                    return Object.entries(statusCounts).map(
                                      (entry, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={colors[index % colors.length]}
                                        />
                                      )
                                    );
                                  })()}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "6px",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {comparisonYear && yearComparison && (
                <ComparisonTab comparisonData={yearComparison} />
              )}
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default CostAnalytics;
