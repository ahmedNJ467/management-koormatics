
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { DollarSign, TrendingDown, TrendingUp, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase";

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Type definitions
type CostData = {
  maintenance: number;
  fuel: number;
  total: number;
};

type MonthlyData = {
  month: string;
  maintenance: number;
  fuel: number;
  total: number;
};

type VehicleCostData = {
  vehicle_id: string;
  vehicle_name: string;
  maintenance: number;
  fuel: number;
  total: number;
};

type CategoryData = {
  name: string;
  value: number;
};

const CostAnalytics = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const currentYear = new Date().getFullYear();
  
  // Generate year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Fetch maintenance costs
  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['maintenanceCosts', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('cost, category, service_date, vehicle_id, vehicles(make, model, registration)')
        .gte('service_date', `${selectedYear}-01-01`)
        .lte('service_date', `${selectedYear}-12-31`);
      
      if (error) {
        toast({
          title: "Error fetching maintenance data",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
  });

  // Fetch fuel costs
  const { data: fuelData, isLoading: fuelLoading } = useQuery({
    queryKey: ['fuelCosts', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('cost, fuel_type, date, vehicle_id, vehicles(make, model, registration)')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);
      
      if (error) {
        toast({
          title: "Error fetching fuel data",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
  });

  // Calculate summary data
  const summaryCosts: CostData = {
    maintenance: maintenanceData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
    fuel: fuelData?.reduce((sum, item) => sum + Number(item.cost), 0) || 0,
    total: 0
  };
  summaryCosts.total = summaryCosts.maintenance + summaryCosts.fuel;
  
  // Calculate monthly data
  const calculateMonthlyData = (): MonthlyData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => ({
      month,
      maintenance: 0,
      fuel: 0,
      total: 0
    }));
    
    if (maintenanceData) {
      maintenanceData.forEach(item => {
        const month = new Date(item.service_date).getMonth();
        monthlyData[month].maintenance += Number(item.cost);
      });
    }
    
    if (fuelData) {
      fuelData.forEach(item => {
        const month = new Date(item.date).getMonth();
        monthlyData[month].fuel += Number(item.cost);
      });
    }
    
    // Calculate totals
    monthlyData.forEach(item => {
      item.total = item.maintenance + item.fuel;
    });
    
    return monthlyData;
  };

  // Calculate per-vehicle costs
  const calculateVehicleCosts = (): VehicleCostData[] => {
    const vehicleCosts: Record<string, VehicleCostData> = {};
    
    if (maintenanceData) {
      maintenanceData.forEach(item => {
        const vehicleId = item.vehicle_id;
        const vehicleName = item.vehicles ? 
          `${item.vehicles.make} ${item.vehicles.model} (${item.vehicles.registration})` : 
          'Unknown Vehicle';
        
        if (!vehicleCosts[vehicleId]) {
          vehicleCosts[vehicleId] = {
            vehicle_id: vehicleId,
            vehicle_name: vehicleName,
            maintenance: 0,
            fuel: 0,
            total: 0
          };
        }
        
        vehicleCosts[vehicleId].maintenance += Number(item.cost);
      });
    }
    
    if (fuelData) {
      fuelData.forEach(item => {
        const vehicleId = item.vehicle_id;
        const vehicleName = item.vehicles ? 
          `${item.vehicles.make} ${item.vehicles.model} (${item.vehicles.registration})` : 
          'Unknown Vehicle';
        
        if (!vehicleCosts[vehicleId]) {
          vehicleCosts[vehicleId] = {
            vehicle_id: vehicleId,
            vehicle_name: vehicleName,
            maintenance: 0,
            fuel: 0,
            total: 0
          };
        }
        
        vehicleCosts[vehicleId].fuel += Number(item.cost);
      });
    }
    
    // Calculate totals and convert to array
    return Object.values(vehicleCosts).map(vehicle => {
      vehicle.total = vehicle.maintenance + vehicle.fuel;
      return vehicle;
    }).sort((a, b) => b.total - a.total); // Sort by total cost
  };

  // Calculate maintenance categories
  const calculateMaintenanceCategories = (): CategoryData[] => {
    const categories: Record<string, number> = {};
    
    if (maintenanceData) {
      maintenanceData.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += Number(item.cost);
      });
    }
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Calculate fuel types
  const calculateFuelTypes = (): CategoryData[] => {
    const fuelTypes: Record<string, number> = {};
    
    if (fuelData) {
      fuelData.forEach(item => {
        const fuelType = item.fuel_type || 'Other';
        if (!fuelTypes[fuelType]) {
          fuelTypes[fuelType] = 0;
        }
        fuelTypes[fuelType] += Number(item.cost);
      });
    }
    
    return Object.entries(fuelTypes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const isLoading = maintenanceLoading || fuelLoading;
  const monthlyData = calculateMonthlyData();
  const vehicleCosts = calculateVehicleCosts();
  const maintenanceCategories = calculateMaintenanceCategories();
  const fuelTypes = calculateFuelTypes();

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryCosts.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">For year {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryCosts.maintenance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {summaryCosts.total > 0 
                ? `${Math.round((summaryCosts.maintenance / summaryCosts.total) * 100)}% of total costs`
                : '0% of total costs'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Costs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryCosts.fuel.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {summaryCosts.total > 0 
                ? `${Math.round((summaryCosts.fuel / summaryCosts.total) * 100)}% of total costs`
                : '0% of total costs'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
          <TabsTrigger value="details">Detailed Records</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cost Breakdown</CardTitle>
              <CardDescription>
                View maintenance and fuel costs by month for {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: '6px' 
                    }}
                  />
                  <Legend />
                  <Bar name="Maintenance" dataKey="maintenance" fill="#0088FE" />
                  <Bar name="Fuel" dataKey="fuel" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Trend</CardTitle>
              <CardDescription>Monthly total cost trend for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: '6px' 
                    }}
                  />
                  <Legend />
                  <Line type="monotone" name="Total Cost" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Categories</CardTitle>
                <CardDescription>
                  Cost breakdown by maintenance type for {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={maintenanceCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {maintenanceCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))', 
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fuel Type Distribution</CardTitle>
                <CardDescription>
                  Cost breakdown by fuel type for {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fuelTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fuelTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))', 
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Vehicle</CardTitle>
              <CardDescription>
                Comparison of maintenance and fuel costs across vehicles for {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={vehicleCosts} 
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="vehicle_name" width={140} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: '6px' 
                    }}
                  />
                  <Legend />
                  <Bar name="Maintenance" dataKey="maintenance" fill="#0088FE" />
                  <Bar name="Fuel" dataKey="fuel" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Cost Details</CardTitle>
              <CardDescription>
                Detailed breakdown of costs per vehicle for {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {vehicleCosts.map((vehicle) => (
                  <div key={vehicle.vehicle_id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{vehicle.vehicle_name}</h3>
                      <div className="font-bold">${vehicle.total.toFixed(2)}</div>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ 
                          width: `${(vehicle.total / vehicleCosts[0]?.total || 1) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="text-muted-foreground">
                        Maintenance: <span className="font-medium text-foreground">${vehicle.maintenance.toFixed(2)}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Fuel: <span className="font-medium text-foreground">${vehicle.fuel.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CostAnalytics;
