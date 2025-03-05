import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDown, Download, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinancialData, MonthlyFinancialData } from "@/lib/financial-calculations";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { exportToPDF, exportToCSV } from "../utils/exportUtils";
import { DateRange } from "react-day-picker";
import { filterDataByDate } from "../utils/dateFilters";
import { calculateFinancialData } from "@/lib/financial-calculations";

interface FinancialReportProps {
  tripsData: any[] | undefined;
  maintenanceData: any[] | undefined;
  fuelData: any[] | undefined;
  isLoadingTrips: boolean;
  isLoadingMaintenance: boolean;
  isLoadingFuel: boolean;
  timeRange: string;
  dateRange: DateRange | undefined;
}

export function FinancialReport({
  tripsData = [],
  maintenanceData = [],
  fuelData = [],
  isLoadingTrips,
  isLoadingMaintenance,
  isLoadingFuel,
  timeRange,
  dateRange
}: FinancialReportProps) {
  // Filter all data by date
  const filteredTrips = filterDataByDate(tripsData, timeRange, dateRange);
  const filteredMaintenance = filterDataByDate(maintenanceData, timeRange, dateRange);
  const filteredFuel = filterDataByDate(fuelData, timeRange, dateRange);
  
  console.log('Financial Report - Maintenance data before filter:', maintenanceData);
  console.log('Financial Report - Filtered maintenance data:', filteredMaintenance);
  
  // Only include completed maintenance for expense calculations
  const completedMaintenance = Array.isArray(filteredMaintenance) 
    ? filteredMaintenance.filter(item => item && item.status === 'completed')
    : [];
  
  console.log('Financial Report - Completed maintenance items:', completedMaintenance);
  
  // Calculate financial metrics
  const financialData = calculateFinancialData(
    filteredTrips || [],
    completedMaintenance || [], // Pass only completed maintenance
    filteredFuel || []
  );
  
  const isLoading = isLoadingTrips || isLoadingMaintenance || isLoadingFuel;
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Generate PDF report
  const exportFinancialPDF = () => {
    exportToPDF(financialData.monthlyData, 'Financial Report', 'financial-report');
  };
  
  // Generate CSV report
  const exportFinancialCSV = () => {
    exportToCSV(financialData.monthlyData, 'financial-report');
  };
  
  // Colors for chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  // Expense breakdown data for pie chart
  const expenseBreakdown = [
    { 
      name: 'Maintenance', 
      value: completedMaintenance.reduce((sum, item) => sum + Number(item.cost || 0), 0) 
    },
    { 
      name: 'Fuel', 
      value: Array.isArray(filteredFuel) ? filteredFuel.reduce((sum, item) => sum + Number(item.cost || 0), 0) : 0 
    }
  ];
  
  console.log('Financial Report - Expense breakdown:', expenseBreakdown);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Overview</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportFinancialPDF}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportFinancialCSV}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p>Loading financial data...</p>
        </div>
      ) : (
        <>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {financialData.tripCount} trips
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Expenses</CardTitle>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Maintenance & fuel expenses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Profit</CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(financialData.profit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Margin: {financialData.profitMargin.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Monthly Revenue and Profit Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue & Profit</CardTitle>
              <CardDescription>Revenue, expenses and profit by month</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), undefined]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: '6px' 
                    }}
                  />
                  <Legend />
                  <Bar name="Revenue" dataKey="revenue" fill="#22c55e" />
                  <Bar name="Expenses" dataKey="expenses" fill="#ef4444" />
                  <Bar name="Profit" dataKey="profit" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Breakdown Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Maintenance vs. fuel expenses</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Cost']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))', 
                        borderRadius: '6px' 
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Financial Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
                <CardDescription>Monthly breakdown of revenue and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[240px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Expenses</TableHead>
                        <TableHead>Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.monthlyData.length > 0 ? (
                        financialData.monthlyData.map((monthData, index) => (
                          <TableRow key={index}>
                            <TableCell>{monthData.month}</TableCell>
                            <TableCell>{formatCurrency(monthData.revenue)}</TableCell>
                            <TableCell>{formatCurrency(monthData.expenses)}</TableCell>
                            <TableCell className={monthData.profit >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(monthData.profit)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
