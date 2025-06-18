import { format } from "date-fns";
import { FileDown, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportToPDF, exportToCSV } from "../utils/exportUtils";
import { DateRange } from "react-day-picker";
import { filterDataByDate } from "../utils/dateFilters";

interface VehiclesReportProps {
  vehiclesData: any[] | undefined;
  isLoading: boolean;
  timeRange: string;
  dateRange: DateRange | undefined;
}

export function VehiclesReport({
  vehiclesData,
  isLoading,
  timeRange,
  dateRange,
}: VehiclesReportProps) {
  const filteredData = filterDataByDate(vehiclesData, timeRange, dateRange);

  const getVehicleMaintenanceCosts = (vehicleId: string) => {
    if (!filteredData) return 0;

    const vehicle = filteredData.find((v) => v.id === vehicleId);
    if (!vehicle || !vehicle.maintenance) return 0;

    return Array.isArray(vehicle.maintenance)
      ? vehicle.maintenance.reduce(
          (sum, item) => sum + Number(item.cost || 0),
          0
        )
      : 0;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Vehicles Report</CardTitle>
          <CardDescription>
            Overview of all vehicles and their stats
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToPDF(
                vehiclesData || [],
                "Vehicles Report",
                "vehicles-report"
              )
            }
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(vehiclesData || [], "vehicles-report")}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead className="text-right">Maintenance Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : vehiclesData && vehiclesData.length > 0 ? (
                vehiclesData.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </TableCell>
                    <TableCell>{vehicle.status}</TableCell>
                    <TableCell>{vehicle.type}</TableCell>
                    <TableCell>{vehicle.registration}</TableCell>
                    <TableCell className="text-right">
                      ${getVehicleMaintenanceCosts(vehicle.id).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
