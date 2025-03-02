
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportSummaryCardsProps {
  fuelCost: number | string;
  maintenanceCost: number | string;
  tripRevenue: number | string;
  isLoadingFuel: boolean;
  isLoadingMaintenance: boolean;
  isLoadingTrips: boolean;
}

export const ReportSummaryCards = ({
  fuelCost,
  maintenanceCost,
  tripRevenue,
  isLoadingFuel,
  isLoadingMaintenance,
  isLoadingTrips
}: ReportSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Fuel Expenses</CardTitle>
          <CardDescription>Total fuel costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${isLoadingFuel ? "..." : fuelCost}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Maintenance Costs</CardTitle>
          <CardDescription>Total maintenance costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${isLoadingMaintenance ? "..." : maintenanceCost}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Trip Revenue</CardTitle>
          <CardDescription>Total trip revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${isLoadingTrips ? "..." : tripRevenue}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
