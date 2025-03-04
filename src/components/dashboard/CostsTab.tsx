
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenanceCostsChart } from "@/components/dashboard/charts/MaintenanceCostsChart";
import { FuelCostsChart } from "@/components/dashboard/charts/FuelCostsChart";
import { CostsBreakdownProps } from "@/types/dashboard";
import { DollarSign, BarChart, Fuel, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardChartsData } from "@/hooks/use-dashboard-charts-data";
import { Skeleton } from "@/components/ui/skeleton";

interface CostsTabProps {
  costsBreakdown: CostsBreakdownProps;
  isLoading?: boolean;
}

export const CostsTab = ({ costsBreakdown, isLoading = false }: CostsTabProps) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const chartData = useDashboardChartsData(vehicles, [], maintenance, fuelLogs);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*');
        
        if (vehiclesError) throw vehiclesError;
        setVehicles(vehiclesData || []);
        
        // Fetch maintenance
        const { data: maintenanceData, error: maintenanceError } = await supabase
          .from('maintenance')
          .select('*');
        
        if (maintenanceError) throw maintenanceError;
        setMaintenance(maintenanceData || []);
        
        // Fetch fuel logs
        const { data: fuelLogsData, error: fuelLogsError } = await supabase
          .from('fuel_logs')
          .select('*');
        
        if (fuelLogsError) throw fuelLogsError;
        setFuelLogs(fuelLogsData || []);
        
      } catch (error) {
        console.error('Error fetching costs data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const renderSkeletonContent = () => (
    <div className="h-[300px] flex items-center justify-center">
      <Skeleton className="h-[250px] w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="h-4 w-4 mr-2" />
              Maintenance Costs
            </CardTitle>
            <CardDescription>
              Total: ${costsBreakdown.maintenance.total.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Service</div>
                  <div className="text-xl font-bold">${costsBreakdown.maintenance.service.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <DollarSign className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Repairs</div>
                  <div className="text-xl font-bold">${costsBreakdown.maintenance.repairs.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Fuel className="h-4 w-4 mr-2" />
              Fuel Costs
            </CardTitle>
            <CardDescription>
              Total: ${costsBreakdown.fuel.total.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Diesel</div>
                  <div className="text-xl font-bold">${costsBreakdown.fuel.diesel.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Petrol</div>
                  <div className="text-xl font-bold">${costsBreakdown.fuel.petrol.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              Maintenance Costs Trend
            </CardTitle>
            <CardDescription>
              Monthly maintenance costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading || loading ? renderSkeletonContent() : (
                <MaintenanceCostsChart data={chartData.maintenanceCostData} />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              Fuel Costs Trend
            </CardTitle>
            <CardDescription>
              Monthly fuel costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading || loading ? renderSkeletonContent() : (
                <FuelCostsChart data={chartData.fuelCostData} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
