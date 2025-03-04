
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FuelConsumptionChart } from "@/components/dashboard/charts/FuelConsumptionChart";
import { FleetDistributionChart } from "@/components/dashboard/charts/FleetDistributionChart";
import { DriverStatusChart } from "@/components/dashboard/charts/DriverStatusChart";
import { Fuel, PieChart, Users } from "lucide-react";

interface AnalyticsTabProps {
  isLoading?: boolean;
}

export const AnalyticsTab = ({ isLoading = false }: AnalyticsTabProps) => {
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
            <FuelConsumptionChart />
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
              <FleetDistributionChart />
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
              <DriverStatusChart />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
