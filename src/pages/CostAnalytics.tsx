
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingDown, TrendingUp, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CostSummaryCards } from "@/components/cost-analytics/CostSummaryCards";
import { OverviewTab } from "@/components/cost-analytics/OverviewTab";
import { CategoriesTab } from "@/components/cost-analytics/CategoriesTab";
import { VehiclesTab } from "@/components/cost-analytics/VehiclesTab";
import { DetailsTab } from "@/components/cost-analytics/DetailsTab";

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
      <CostSummaryCards summaryCosts={summaryCosts} selectedYear={selectedYear} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
          <TabsTrigger value="details">Detailed Records</TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <OverviewTab monthlyData={monthlyData} />
        <CategoriesTab maintenanceCategories={maintenanceCategories} fuelTypes={fuelTypes} />
        <VehiclesTab vehicleCosts={vehicleCosts} />
        <DetailsTab vehicleCosts={vehicleCosts} />
      </Tabs>
    </div>
  );
};

export default CostAnalytics;
