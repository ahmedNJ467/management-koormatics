
import { format } from "date-fns";
import { FileDown, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportToPDF, exportToCSV } from "../utils/exportUtils";
import { DateRange } from "react-day-picker";
import { filterDataByDate } from "../utils/dateFilters";

interface MaintenanceReportProps {
  maintenanceData: any[] | undefined;
  isLoading: boolean;
  timeRange: string;
  dateRange: DateRange | undefined;
}

export function MaintenanceReport({ maintenanceData, isLoading, timeRange, dateRange }: MaintenanceReportProps) {
  const filteredData = filterDataByDate(maintenanceData, timeRange, dateRange);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Maintenance Report</CardTitle>
          <CardDescription>All maintenance records for the selected period</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToPDF(filteredData || [], 'Maintenance Report', 'maintenance-report')}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(filteredData || [], 'maintenance-report')}
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
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Service Provider</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {record.vehicles?.make} {record.vehicles?.model}
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>{record.status}</TableCell>
                    <TableCell>{record.service_provider || 'N/A'}</TableCell>
                    <TableCell className="text-right">${Number(record.cost).toFixed(2)}</TableCell>
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
