
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { Maintenance, FuelLog } from "@/lib/types";
import { CircleDollarSign, Wrench, Fuel } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6BCB77', '#4D96FF'];

export default function CostAnalytics() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ["maintenance", year],
    queryFn: async () => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      const { data, error } = await supabase
        .from("maintenance")
        .select(`
          id, 
          date, 
          description, 
          cost, 
          status,
          service_provider,
          vehicle:vehicles (id, make, model, registration)
        `)
        .gte("date", startDate)
        .lte("date", endDate);
      
      if (error) throw error;
      return data as Maintenance[];
    },
  });
  
  const { data: fuelData, isLoading: isLoadingFuel } = useQuery({
    queryKey: ["fuel_logs", year],
    queryFn: async () => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      const { data, error } = await supabase
        .from("fuel_logs")
        .select(`
          id, 
          date, 
          fuel_type, 
          volume, 
          cost, 
          mileage,
          vehicle:vehicles (id, make, model, registration)
        `)
        .gte("date", startDate)
        .lte("date", endDate);
      
      if (error) throw error;
      return data as FuelLog[];
    },
  });
  
  const isLoading = isLoadingMaintenance || isLoadingFuel;
  
  // Calculate total costs
  const totalMaintenanceCost = maintenanceData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0;
  const totalFuelCost = fuelData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0;
  const totalCost = totalMaintenanceCost + totalFuelCost;
  
  // Group maintenance data by description type (service, repair, etc.)
  const maintenanceByType = maintenanceData?.reduce((acc, item) => {
    const type = item.description.toLowerCase().includes('repair') 
      ? 'Repairs' 
      : item.description.toLowerCase().includes('service') 
        ? 'Service' 
        : 'Other';
    
    if (!acc[type]) acc[type] = 0;
    acc[type] += Number(item.cost);
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Group fuel data by fuel type
  const fuelByType = fuelData?.reduce((acc, item) => {
    const type = item.fuel_type.charAt(0).toUpperCase() + item.fuel_type.slice(1);
    if (!acc[type]) acc[type] = 0;
    acc[type] += Number(item.cost);
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Generate monthly cost data
  const generateMonthlyData = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const monthlyData = months.map(month => ({
      name: month,
      maintenance: 0,
      fuel: 0
    }));
    
    maintenanceData?.forEach(item => {
      const monthIndex = new Date(item.date).getMonth();
      monthlyData[monthIndex].maintenance += Number(item.cost);
    });
    
    fuelData?.forEach(item => {
      const monthIndex = new Date(item.date).getMonth();
      monthlyData[monthIndex].fuel += Number(item.cost);
    });
    
    return monthlyData;
  };
  
  // Format data for pie charts
  const formatPieData = (data: Record<string, number>) => {
    return Object.entries(data).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  };
  
  // Group by vehicle
  const costsByVehicle = () => {
    const vehicles: Record<string, { id: string, name: string, maintenance: number, fuel: number }> = {};
    
    maintenanceData?.forEach(item => {
      if (!item.vehicle) return;
      
      const vehicleId = item.vehicle.id;
      const vehicleName = `${item.vehicle.make} ${item.vehicle.model} (${item.vehicle.registration})`;
      
      if (!vehicles[vehicleId]) {
        vehicles[vehicleId] = {
          id: vehicleId,
          name: vehicleName,
          maintenance: 0,
          fuel: 0
        };
      }
      
      vehicles[vehicleId].maintenance += Number(item.cost);
    });
    
    fuelData?.forEach(item => {
      if (!item.vehicle) return;
      
      const vehicleId = item.vehicle.id;
      const vehicleName = `${item.vehicle.make} ${item.vehicle.model} (${item.vehicle.registration})`;
      
      if (!vehicles[vehicleId]) {
        vehicles[vehicleId] = {
          id: vehicleId,
          name: vehicleName,
          maintenance: 0,
          fuel: 0
        };
      }
      
      vehicles[vehicleId].fuel += Number(item.cost);
    });
    
    return Object.values(vehicles).sort((a, b) => 
      (b.maintenance + b.fuel) - (a.maintenance + a.fuel)
    );
  };
  
  const monthlyData = generateMonthlyData();
  const maintenancePieData = formatPieData(maintenanceByType);
  const fuelPieData = formatPieData(fuelByType);
  const vehicleCosts = costsByVehicle();
  
  // Available years for selection
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 5; i <= currentYear; i++) {
    years.push(i.toString());
  }
  
  // Render pie chart component
  const renderPieChart = (data: { name: string, value: number }[], title: string) => (
    <div className="h-[300px] w-full flex flex-col items-center">
      <h3 className="text-center mb-2 font-medium">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Cost Analytics</h2>
          <p className="text-muted-foreground">Analyze and track your fleet expenses</p>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Year" />
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
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Loading cost data...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <CardDescription>All expenses ({year})</CardDescription>
                </div>
                <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Maintenance Cost</CardTitle>
                  <CardDescription>Services & repairs ({year})</CardDescription>
                </div>
                <Wrench className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalMaintenanceCost.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium">Fuel Cost</CardTitle>
                  <CardDescription>All fuel types ({year})</CardDescription>
                </div>
                <Fuel className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalFuelCost.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="byCategory">By Category</TabsTrigger>
              <TabsTrigger value="byVehicle">By Vehicle</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Cost Distribution ({year})</CardTitle>
                  <CardDescription>
                    Breakdown of maintenance and fuel costs throughout the year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-muted-foreground text-xs" />
                        <YAxis className="text-muted-foreground text-xs" />
                        <Tooltip 
                          formatter={(value) => `$${Number(value).toFixed(2)}`}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '0.875rem'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="maintenance" name="Maintenance" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="fuel" name="Fuel" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Proportions ({year})</CardTitle>
                    <CardDescription>
                      Maintenance vs. Fuel cost ratio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    {renderPieChart([
                      { name: 'Maintenance', value: Number(totalMaintenanceCost.toFixed(2)) },
                      { name: 'Fuel', value: Number(totalFuelCost.toFixed(2)) }
                    ], 'Cost Distribution')}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Statistics ({year})</CardTitle>
                    <CardDescription>
                      Key metrics and cost ratios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Maintenance %</p>
                          <p className="text-2xl font-bold">
                            {totalCost ? ((totalMaintenanceCost / totalCost) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Fuel %</p>
                          <p className="text-2xl font-bold">
                            {totalCost ? ((totalFuelCost / totalCost) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-medium mb-2">Monthly Averages</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Maintenance</p>
                            <p className="text-lg font-medium">
                              ${(totalMaintenanceCost / 12).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fuel</p>
                            <p className="text-lg font-medium">
                              ${(totalFuelCost / 12).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="byCategory" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance Cost Breakdown</CardTitle>
                    <CardDescription>
                      Distribution by maintenance type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {maintenancePieData.length > 0 ? (
                      renderPieChart(maintenancePieData, 'Maintenance Costs')
                    ) : (
                      <div className="flex items-center justify-center h-[300px]">
                        No maintenance data available for {year}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Fuel Cost Breakdown</CardTitle>
                    <CardDescription>
                      Distribution by fuel type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {fuelPieData.length > 0 ? (
                      renderPieChart(fuelPieData, 'Fuel Costs')
                    ) : (
                      <div className="flex items-center justify-center h-[300px]">
                        No fuel data available for {year}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="byVehicle" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cost By Vehicle</CardTitle>
                  <CardDescription>
                    Breakdown of expenses by vehicle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vehicleCosts.length > 0 ? (
                    <div className="h-[500px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={vehicleCosts} 
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" className="text-muted-foreground text-xs" />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={90}
                            className="text-muted-foreground text-xs"
                          />
                          <Tooltip 
                            formatter={(value) => `$${Number(value).toFixed(2)}`}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '0.875rem'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="maintenance" name="Maintenance" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="fuel" name="Fuel" fill="#10B981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[400px]">
                      No cost data available for {year}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Maintenance Details</CardTitle>
                    <CardDescription>
                      Individual maintenance records for {year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenanceData?.length ? (
                          maintenanceData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                              <TableCell>{item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : 'Unknown'}</TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell className="text-right">${Number(item.cost).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">
                              No maintenance records found for {year}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Fuel Details</CardTitle>
                    <CardDescription>
                      Individual fuel records for {year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Fuel Type</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fuelData?.length ? (
                          fuelData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                              <TableCell>{item.vehicle ? `${item.vehicle.make} ${item.vehicle.model}` : 'Unknown'}</TableCell>
                              <TableCell className="capitalize">{item.fuel_type}</TableCell>
                              <TableCell>{item.volume} L</TableCell>
                              <TableCell className="text-right">${Number(item.cost).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No fuel records found for {year}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
