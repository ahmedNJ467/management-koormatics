
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenanceCostsChart } from "@/components/dashboard/charts/MaintenanceCostsChart";
import { FuelCostsChart } from "@/components/dashboard/charts/FuelCostsChart";
import { CostsBreakdownProps } from "@/types/dashboard";
import { Fuel, Wrench } from "lucide-react";

interface CostsTabProps {
  costsBreakdown: CostsBreakdownProps;
  isLoading?: boolean;
}

export const CostsTab = ({ costsBreakdown, isLoading = false }: CostsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Maintenance Costs Summary */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Wrench className="h-5 w-5 mr-2" />
              Maintenance Costs (USD)
            </CardTitle>
            <CardDescription>
              Breakdown of vehicle maintenance expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${costsBreakdown.maintenance.service.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Repairs</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">${costsBreakdown.maintenance.repairs.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">${costsBreakdown.maintenance.total.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="h-[250px]">
              <MaintenanceCostsChart />
            </div>
          </CardContent>
        </Card>
        
        {/* Fuel Costs Summary */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Fuel className="h-5 w-5 mr-2" />
              Fuel Costs (USD)
            </CardTitle>
            <CardDescription>
              Monthly breakdown by fuel type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Diesel</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">${costsBreakdown.fuel.diesel.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Petrol</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${costsBreakdown.fuel.petrol.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${costsBreakdown.fuel.total.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="h-[250px]">
              <FuelCostsChart />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
