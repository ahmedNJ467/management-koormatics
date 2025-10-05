import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { calculateFinancialData } from "@/lib/financial-calculations";

interface ReportsSummaryCardsProps {
  fuelData: any[] | undefined;
  maintenanceData: any[] | undefined;
  tripsData: any[] | undefined;
  sparePartsData?: any[] | undefined;
  isLoadingFuel: boolean;
  isLoadingMaintenance: boolean;
  isLoadingTrips: boolean;
  isLoadingSpareparts?: boolean;
}

export function ReportsSummaryCards({
  fuelData,
  maintenanceData,
  tripsData,
  sparePartsData,
  isLoadingFuel,
  isLoadingMaintenance,
  isLoadingTrips,
  isLoadingSpareparts = false,
}: ReportsSummaryCardsProps) {
  const financialData = calculateFinancialData(
    tripsData || [],
    maintenanceData || [],
    fuelData || [],
    sparePartsData || [],
    [], // vehicleLeasesData - not needed since we use leaseInvoicesData
    [] // leaseInvoicesData - will be added when needed
  );

  const isLoading =
    isLoadingFuel ||
    isLoadingMaintenance ||
    isLoadingTrips ||
    isLoadingSpareparts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Fuel Expenses</CardTitle>
          <CardDescription>Total fuel costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${isLoading ? "..." : financialData.totalExpenses.toFixed(2)}
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
            ${isLoading ? "..." : financialData.totalExpenses.toFixed(2)}
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
            ${isLoading ? "..." : financialData.totalRevenue.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      <Card
        className={
          financialData.profit >= 0 ? "border-green-500" : "border-red-500"
        }
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Profit</CardTitle>
          <CardDescription>Revenue minus expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              financialData.profit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${isLoading ? "..." : financialData.profit.toFixed(2)}
          </div>
          {!isLoading && (
            <div className="text-xs text-muted-foreground">
              {financialData.totalRevenue > 0
                ? `Margin: ${financialData.profitMargin.toFixed(1)}%`
                : "No revenue recorded"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
