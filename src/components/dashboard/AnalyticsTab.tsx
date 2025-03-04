
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FuelConsumptionChart } from "@/components/dashboard/charts/FuelConsumptionChart";
import { FleetDistributionChart } from "@/components/dashboard/charts/FleetDistributionChart";
import { DriverStatusChart } from "@/components/dashboard/charts/DriverStatusChart";
import { Fuel, PieChart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardChartsData } from "@/hooks/use-dashboard-charts-data";

interface AnalyticsTabProps {
  isLoading?: boolean;
}

export const AnalyticsTab = ({ isLoading = false }: AnalyticsTabProps) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const chartData = useDashboardChartsData(vehicles, drivers, maintenance, fuelLogs);

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
        
        // Fetch drivers
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*');
        
        if (driversError) throw driversError;
        setDrivers(driversData || []);
        
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
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const renderContent = (isLoading || loading) ? (
    <div className="h-[300px] flex items-center justify-center">
      <Skeleton className="h-[250px] w-full" />
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Fuel className="h-4 w-4 mr-2" />
            Fuel Consumption Trend
          </CardTitle>
          <CardDescription>
            Monthly fuel consumption in liters
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[300px] p-4">
            {isLoading || loading ? renderContent : (
              <FuelConsumptionChart data={chartData.fuelConsumptionData} />
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-4 w-4 mr-2" />
              Fleet Distribution
            </CardTitle>
            <CardDescription>
              Vehicles by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading || loading ? renderContent : (
                <FleetDistributionChart data={chartData.fleetDistributionData} />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Driver Status
            </CardTitle>
            <CardDescription>
              Driver availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading || loading ? renderContent : (
                <DriverStatusChart data={chartData.driverStatusData} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
