
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";
import { format } from "date-fns";
import { useFuelData } from "../hooks/useReportData";
import { exportToPDF, exportToCSV } from "../utils/export-utils";
import { ReportProps } from "../types";

export const FuelReport = ({ timeRange, dateRange }: ReportProps) => {
  const { data: fuelData, isLoading: isLoadingFuel } = useFuelData(timeRange, dateRange);

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Fuel Consumption Report</CardTitle>
          <CardDescription>All fuel expenses for the selected period</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToPDF(fuelData || [], 'Fuel Consumption Report', 'fuel-report')}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(fuelData || [], 'fuel-report')}
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
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingFuel ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : fuelData && fuelData.length > 0 ? (
                fuelData.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {log.vehicles?.make} {log.vehicles?.model}
                    </TableCell>
                    <TableCell>{log.volume} L</TableCell>
                    <TableCell>{log.fuel_type}</TableCell>
                    <TableCell>{log.mileage} km</TableCell>
                    <TableCell className="text-right">${Number(log.cost).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
