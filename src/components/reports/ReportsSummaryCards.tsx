
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportsSummaryCardsProps {
  fuelData: any[] | undefined;
  maintenanceData: any[] | undefined;
  tripsData: any[] | undefined;
  isLoadingFuel: boolean;
  isLoadingMaintenance: boolean;
  isLoadingTrips: boolean;
}

export function ReportsSummaryCards({
  fuelData,
  maintenanceData,
  tripsData,
  isLoadingFuel,
  isLoadingMaintenance,
  isLoadingTrips
}: ReportsSummaryCardsProps) {
  const calculateTotalFuelCost = () => {
    if (!fuelData) return 0;
    return fuelData.reduce((sum, log) => sum + Number(log.cost || 0), 0);
  };

  const calculateTotalMaintenanceCost = () => {
    if (!maintenanceData) return 0;
    return maintenanceData.reduce((sum, record) => sum + Number(record.cost || 0), 0);
  };

  const calculateTotalTripRevenue = () => {
    if (!tripsData) return 0;
    return tripsData.reduce((sum, trip) => sum + Number(trip.amount || 0), 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Fuel Expenses</CardTitle>
          <CardDescription>Total fuel costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${isLoadingFuel ? "..." : calculateTotalFuelCost().toFixed(2)}
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
            ${isLoadingMaintenance ? "..." : calculateTotalMaintenanceCost().toFixed(2)}
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
            ${isLoadingTrips ? "..." : calculateTotalTripRevenue().toFixed(2)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
