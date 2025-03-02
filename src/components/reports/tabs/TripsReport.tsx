
import { format } from "date-fns";
import { FileDown, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportToPDF, exportToCSV } from "../utils/exportUtils";
import { DateRange } from "react-day-picker";
import { filterDataByDate } from "../utils/dateFilters";

interface TripsReportProps {
  tripsData: any[] | undefined;
  isLoading: boolean;
  timeRange: string;
  dateRange: DateRange | undefined;
}

export function TripsReport({ tripsData, isLoading, timeRange, dateRange }: TripsReportProps) {
  const filteredData = filterDataByDate(tripsData, timeRange, dateRange);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Trips Report</CardTitle>
          <CardDescription>All trips for the selected period</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToPDF(filteredData || [], 'Trips Report', 'trips-report')}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(filteredData || [], 'trips-report')}
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
                <TableHead>Service Type</TableHead>
                <TableHead>Pick-up</TableHead>
                <TableHead>Drop-off</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>{format(new Date(trip.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {trip.clients?.type === 'organization' ? (
                        <div>
                          {trip.clients?.name || 'N/A'}
                          {trip.passengers && trip.passengers.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {trip.passengers.map((passenger: string, index: number) => (
                                <div key={index} className="text-xs text-muted-foreground pl-2 border-l-2 border-gray-300">
                                  {passenger}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        trip.clients?.name || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>{trip.display_type || trip.service_type}</TableCell>
                    <TableCell>{trip.pickup_location}</TableCell>
                    <TableCell>{trip.dropoff_location}</TableCell>
                    <TableCell>{trip.vehicles?.make} {trip.vehicles?.model}</TableCell>
                    <TableCell>{trip.drivers?.name}</TableCell>
                    <TableCell>{trip.status}</TableCell>
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
}
