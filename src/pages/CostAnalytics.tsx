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
import { useLeaseInvoices } from "@/hooks/useLeaseInvoices";
import {
  calculateFinancialData,
  testFinancialCalculations,
} from "@/lib/financial-calculations";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { OverviewTab } from "@/components/cost-analytics/OverviewTab";
import { VehiclesTab } from "@/components/cost-analytics/VehiclesTab";
import { ComparisonTab } from "@/components/cost-analytics/ComparisonTab";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

  // Fetch vehicle lease data
  const { data: vehicleLeasesData = [] } = useQuery({
    queryKey: ["vehicle-leases"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicle_leases").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Get lease invoices data
  const { leaseInvoices } = useLeaseInvoices();

  const financialData = calculateFinancialData(
    validTripsData,
    validMaintenanceData,
    validFuelData,
    validSparePartsData,
    vehicleLeasesData,
    leaseInvoices || []
  );

  const comparisonFinancialData = comparisonYear
    ? calculateFinancialData(
        Array.isArray(comparisonTripsData) ? comparisonTripsData : [],
        Array.isArray(comparisonMaintenanceData)
          ? comparisonMaintenanceData
          : [],
        Array.isArray(comparisonFuelData) ? comparisonFuelData : [],
        Array.isArray(comparisonSparePartsData) ? comparisonSparePartsData : [],
        [], // vehicleLeasesData - not needed for comparison
        [] // leaseInvoicesData - not needed for comparison
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

  console.log("CostAnalytics - Selected Year:", selectedYear);
  console.log("CostAnalytics - Spare Parts Data:", validSparePartsData);
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

              <OverviewTab
                monthlyData={monthlyData}
                financialData={financialData}
                isLoading={isLoading}
              />

              <VehiclesTab vehicleCosts={vehicleCosts} />

              <TabsContent value="spare-parts">
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

                {/* Monthly Total Cost Trend */}
                <div className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Monthly Total Cost Trend
                      </CardTitle>
                      <CardDescription>
                        Spare parts spending trends over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={(() => {
                            const monthlyCosts: Record<string, number> = {};

                            console.log(
                              "Chart data generation - Processing spare parts:",
                              validSparePartsData
                            );

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

                                    if (!monthlyCosts[monthKey]) {
                                      monthlyCosts[monthKey] = 0;
                                    }

                                    const partCost =
                                      Number(part.quantity || 0) *
                                      Number(part.unit_price || 0);
                                    monthlyCosts[monthKey] += partCost;

                                    console.log(
                                      `Added part ${part.name} cost $${partCost} to month ${monthKey}`
                                    );
                                  }
                                } catch (error) {
                                  console.warn(
                                    "Error processing purchase date:",
                                    part.purchase_date
                                  );
                                }
                              }
                            });

                            const chartData = Object.entries(monthlyCosts)
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

                            console.log("Generated chart data:", chartData);
                            return chartData;
                          })()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`$${value}`, "Total Cost"]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "6px",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                            activeDot={{
                              r: 6,
                              stroke: "#8B5CF6",
                              strokeWidth: 2,
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
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
