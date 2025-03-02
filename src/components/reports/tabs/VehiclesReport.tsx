
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";
import { format } from "date-fns";
import { useVehiclesData } from "../hooks/useReportData";
import { exportToPDF, exportToCSV, getVehicleMaintenanceCosts } from "../utils/export-utils";

export const VehiclesReport = () => {
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useVehiclesData();

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Vehicles Report</CardTitle>
          <CardDescription>Overview of all vehicles and their stats</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToPDF(vehiclesData || [], 'Vehicles Report', 'vehicles-report')}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(vehiclesData || [], 'vehicles-report')}
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
              {isLoadingVehicles ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : vehiclesData && vehiclesData.length > 0 ? (
                vehiclesData.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.make} {vehicle.model} ({vehicle.year})</TableCell>
                    <TableCell>{vehicle.status}</TableCell>
                    <TableCell>{vehicle.type}</TableCell>
                    <TableCell>{vehicle.registration}</TableCell>
                    <TableCell className="text-right">${getVehicleMaintenanceCosts(vehicle.id, vehiclesData).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
