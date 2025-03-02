
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";
import { format } from "date-fns";
import { useMaintenanceData } from "../hooks/useReportData";
import { exportToPDF, exportToCSV } from "../utils/export-utils";
import { ReportProps } from "../types";

export const MaintenanceReport = ({ timeRange, dateRange }: ReportProps) => {
  const { data: maintenanceData, isLoading: isLoadingMaintenance } = useMaintenanceData(timeRange, dateRange);

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Maintenance Report</CardTitle>
          <CardDescription>All maintenance records for the selected period</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToPDF(maintenanceData || [], 'Maintenance Report', 'maintenance-report')}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(maintenanceData || [], 'maintenance-report')}
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
              {isLoadingMaintenance ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : maintenanceData && maintenanceData.length > 0 ? (
                maintenanceData.map((record) => (
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
};
