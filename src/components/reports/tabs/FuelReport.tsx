
import { format } from "date-fns";
import { FileDown, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportToPDF, exportToCSV } from "../utils/exportUtils";
import { DateRange } from "react-day-picker";
import { filterDataByDate } from "../utils/dateFilters";

interface FuelReportProps {
  fuelData: any[] | undefined;
  isLoading: boolean;
  timeRange: string;
  dateRange: DateRange | undefined;
}

export function FuelReport({ fuelData, isLoading, timeRange, dateRange }: FuelReportProps) {
  const filteredData = filterDataByDate(fuelData, timeRange, dateRange);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Fuel Consumption Report</CardTitle>
          <CardDescription>All fuel expenses for the selected period</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToPDF(filteredData || [], 'Fuel Consumption Report', 'fuel-report')}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(filteredData || [], 'fuel-report')}
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((log) => (
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
}
