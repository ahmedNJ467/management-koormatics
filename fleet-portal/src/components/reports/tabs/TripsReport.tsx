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

// Helper function to format service types
function formatServiceType(serviceType: string | undefined): string {
  if (!serviceType) return "N/A";

  if (serviceType === "airport_pickup") {
    return "Airport Pickup";
  } else if (serviceType === "airport_dropoff") {
    return "Airport Dropoff";
  } else if (serviceType === "round_trip") {
    return "Round Trip";
  } else if (serviceType === "one_way") {
    return "One Way Transfer";
  } else if (serviceType === "full_day_hire") {
    return "Full Day Hire";
  } else if (serviceType === "half_day") {
    return "Half Day";
  } else {
    return serviceType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

// Helper function to format time to AM/PM
function formatTimeToAMPM(time: string | undefined): string {
  if (!time) return "N/A";

  try {
    const timeObj = new Date(`2000-01-01T${time}`);
    return timeObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return time;
  }
}

interface TripsReportProps {
  tripsData: any[] | undefined;
  isLoading: boolean;
  timeRange: string;
  dateRange: DateRange | undefined;
}

export function TripsReport({
  tripsData,
  isLoading,
  timeRange,
  dateRange,
}: TripsReportProps) {
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
            onClick={async () =>
              await exportToPDF(
                filteredData || [],
                "Trips Report",
                "trips-report"
              )
            }
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(filteredData || [], "trips-report")}
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
                <TableHead>Passengers</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Pick-up</TableHead>
                <TableHead>Drop-off</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredData && filteredData.length > 0 ? (
                filteredData.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      {format(new Date(trip.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{trip.clients?.name || "N/A"}</TableCell>
                    <TableCell>
                      {trip.passengers && trip.passengers.length > 0 ? (
                        <div className="space-y-1">
                          {trip.passengers.map(
                            (passenger: string, index: number) => (
                              <div key={index} className="text-sm">
                                {passenger}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatServiceType(
                        trip.display_type || trip.service_type
                      )}
                    </TableCell>
                    <TableCell>{trip.pickup_location}</TableCell>
                    <TableCell>{trip.dropoff_location}</TableCell>
                    <TableCell>
                      {trip.stops && trip.stops.length > 0 ? (
                        <div className="space-y-1">
                          {trip.stops
                            .slice(0, 3)
                            .map((stop: string, index: number) => (
                              <div
                                key={index}
                                className="text-xs text-muted-foreground"
                              >
                                • {stop}
                              </div>
                            ))}
                          {trip.stops.length > 3 && (
                            <div className="text-xs text-muted-foreground italic">
                              +{trip.stops.length - 3} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {trip.vehicles?.make} {trip.vehicles?.model}
                    </TableCell>
                    <TableCell>{trip.drivers?.name}</TableCell>
                    <TableCell>{trip.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
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
