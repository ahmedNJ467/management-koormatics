import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, BarChart3, Fuel, Wrench, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { FuelCostsChart } from "@/components/dashboard/charts/FuelCostsChart";
import { MaintenanceCostsChart } from "@/components/dashboard/charts/MaintenanceCostsChart";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialOverviewChart } from "@/components/dashboard/charts/FinancialOverviewChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FuelLog, Maintenance, MaintenanceType } from "@/lib/types";

export default function CostAnalytics() {
  const [timeframe, setTimeframe] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  // Fetch maintenance data
  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['maintenance-costs', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select(`
          id,
          date,
          description,
          cost,
          status,
          maintenance_type,
          vehicle:vehicles (
            make,
            model,
            registration
          )
        `)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Handle the possible null maintenance_type by defaulting to 'service'
      return (data || []).map(item => ({
        ...item,
        maintenance_type: (item.maintenance_type as MaintenanceType) || 'service'
      })) as Maintenance[];
    },
  });

  // Fetch fuel logs data
  const { data: fuelData, isLoading: isLoadingFuel } = useQuery({
    queryKey: ['fuel-costs', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select(`
          id,
          date,
          fuel_type,
          volume,
          cost,
          vehicle:vehicles (
            make,
            model,
            registration
          )
        `)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as FuelLog[];
    },
  });

  // Calculate total costs
  const totalMaintenanceCost = maintenanceData?.reduce((acc, item) => acc + Number(item.cost), 0) || 0;
  const totalFuelCost = fuelData?.reduce((acc, item) => acc + Number(item.cost), 0) || 0;
  const totalCost = totalMaintenanceCost + totalFuelCost;

  // Calculate fuel costs by type
  const fuelCostsByType = fuelData?.reduce((acc, item) => {
    const fuelType = item.fuel_type;
    acc[fuelType] = (acc[fuelType] || 0) + Number(item.cost);
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate maintenance costs by type
  const maintenanceCostsByType = maintenanceData?.reduce((acc, item) => {
    const type = item.maintenance_type || 'service';
    acc[type] = (acc[type] || 0) + Number(item.cost);
    return acc;
  }, {} as Record<string, number>) || {};

  // Get available years for the filter
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Cost Analytics</h2>
          <p className="text-muted-foreground">Analyze and monitor your fleet expenses</p>
        </div>
        <div className="flex gap-4">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              For {year}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fuel Costs</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFuelCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalCost > 0 ? `${((totalFuelCost / totalCost) * 100).toFixed(1)}% of total expenses` : '0% of total expenses'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMaintenanceCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalCost > 0 ? `${((totalMaintenanceCost / totalCost) * 100).toFixed(1)}% of total expenses` : '0% of total expenses'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Costs</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Costs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                  Combined fleet costs over time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[350px] p-6">
                  <FinancialOverviewChart />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Fuel Cost Distribution</CardTitle>
                  <CardDescription>Breakdown by fuel type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {Object.entries(fuelCostsByType).map(([type, cost]) => (
                      <div key={type} className={`p-3 rounded-lg ${
                        type === 'diesel' ? 'bg-amber-50 dark:bg-amber-950/30' :
                        type === 'petrol' ? 'bg-emerald-50 dark:bg-emerald-950/30' :
                        'bg-blue-50 dark:bg-blue-950/30'
                      }`}>
                        <p className="text-sm text-muted-foreground capitalize">{type}</p>
                        <p className={`text-xl font-bold ${
                          type === 'diesel' ? 'text-amber-600 dark:text-amber-400' :
                          type === 'petrol' ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-blue-600 dark:text-blue-400'
                        }`}>${cost.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Cost Distribution</CardTitle>
                  <CardDescription>Breakdown by maintenance type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(maintenanceCostsByType).map(([type, cost]) => (
                      <div key={type} className={`p-3 rounded-lg ${
                        type === 'service' ? 'bg-blue-50 dark:bg-blue-950/30' :
                        type === 'repair' ? 'bg-red-50 dark:bg-red-950/30' :
                        type === 'inspection' ? 'bg-purple-50 dark:bg-purple-950/30' :
                        'bg-green-50 dark:bg-green-950/30'
                      }`}>
                        <p className="text-sm text-muted-foreground capitalize">{type}</p>
                        <p className={`text-xl font-bold ${
                          type === 'service' ? 'text-blue-600 dark:text-blue-400' :
                          type === 'repair' ? 'text-red-600 dark:text-red-400' :
                          type === 'inspection' ? 'text-purple-600 dark:text-purple-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>${cost.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="fuel">
          <div className="grid gap-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Fuel Costs</CardTitle>
                <CardDescription>Monthly breakdown by fuel type</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[350px] p-6">
                  <FuelCostsChart />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Fuel Expenses</CardTitle>
                <CardDescription>Last 10 fuel logs</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Volume (L)</TableHead>
                      <TableHead>Cost (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingFuel ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : fuelData && fuelData.length > 0 ? (
                      fuelData.slice(0, 10).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {log.vehicle ? `${log.vehicle.make} ${log.vehicle.model}` : "Unknown Vehicle"}
                          </TableCell>
                          <TableCell className="capitalize">{log.fuel_type}</TableCell>
                          <TableCell>{log.volume.toFixed(1)}</TableCell>
                          <TableCell>${log.cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No fuel logs found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="maintenance">
          <div className="grid gap-6">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Maintenance Costs</CardTitle>
                <CardDescription>Monthly breakdown by maintenance type</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[350px] p-6">
                  <MaintenanceCostsChart />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Maintenance Expenses</CardTitle>
                <CardDescription>Last 10 maintenance records</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cost (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMaintenance ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : maintenanceData && maintenanceData.length > 0 ? (
                      maintenanceData.slice(0, 10).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : "Unknown Vehicle"}
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="capitalize">{item.maintenance_type || 'service'}</TableCell>
                          <TableCell>${item.cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No maintenance records found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
