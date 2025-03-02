
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";
import { format } from "date-fns";
import { useTripsData } from "../hooks/useReportData";
import { exportToPDF, exportToCSV } from "../utils/export-utils";
import { ReportProps } from "../types";

export const TripsReport = ({ timeRange, dateRange }: ReportProps) => {
  const { data: tripsData, isLoading: isLoadingTrips } = useTripsData(timeRange, dateRange);

  return (
    <Card className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Trips Report</CardTitle>
          <CardDescription>All trips for the selected period</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToPDF(tripsData || [], 'Trips Report', 'trips-report')}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(tripsData || [], 'trips-report')}
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
                <TableHead>Client</TableHead>
                <TableHead>Pick-up</TableHead>
                <TableHead>Drop-off</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTrips ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : tripsData && tripsData.length > 0 ? (
                tripsData.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>{format(new Date(trip.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{trip.clients?.name}</TableCell>
                    <TableCell>{trip.pickup_location || 'N/A'}</TableCell>
                    <TableCell>{trip.dropoff_location || 'N/A'}</TableCell>
                    <TableCell>
                      {trip.vehicles?.make} {trip.vehicles?.model}
                    </TableCell>
                    <TableCell>{trip.drivers?.name}</TableCell>
                    <TableCell>{trip.status}</TableCell>
                    <TableCell className="text-right">${Number(trip.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">No data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
