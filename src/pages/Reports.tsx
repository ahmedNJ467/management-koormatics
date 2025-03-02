import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  TripStatus,
  TripType,
  DisplayTrip,
  Client,
} from "@/lib/types";

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "MMM d, yyyy");
};

// Helper function to format status
const formatStatus = (status: TripStatus): string => {
  return status.replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to get status badge class
const getStatusBadgeClass = (status: TripStatus): string => {
  switch (status) {
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    case "in_progress":
      return "bg-yellow-100 text-yellow-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Helper function to get the first day of the month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

export default function Reports() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reportType, setReportType] = useState("monthly"); // monthly, quarterly, yearly
  const [clientFilter, setClientFilter] = useState("all"); // all, specific client ID
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  // Fetch trips data
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["trips", currentMonth, reportType, clientFilter],
    queryFn: async () => {
      let startDate: Date, endDate: Date;

      if (reportType === "monthly") {
        startDate = startOfMonth(currentMonth);
        endDate = endOfMonth(currentMonth);
      } else if (reportType === "quarterly") {
        const quarterStartMonth = Math.floor(currentMonth.getMonth() / 3) * 3;
        startDate = new Date(currentMonth.getFullYear(), quarterStartMonth, 1);
        endDate = new Date(currentMonth.getFullYear(), quarterStartMonth + 2, 31);
      } else { // yearly
        startDate = new Date(currentMonth.getFullYear(), 0, 1);
        endDate = new Date(currentMonth.getFullYear(), 11, 31);
      }

      let query = supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email, type, address, phone)
        `)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"));

      if (clientFilter !== "all" && selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }

      const { data, error } = await query.order("date", { ascending: false });

      if (error) throw error;

      // Process each trip to ensure it has the required fields
      const processedTrips = data.map((trip) => {
        // Add missing fields with default values
        return {
          ...trip,
          notes: trip.notes || trip.special_instructions || "",
          type: trip.type || trip.service_type || "other",
          status: trip.status || "scheduled"
        };
      });

      return processedTrips;
    },
  });

  // Fetch clients for the client filter
  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, type")
        .order("name");

      if (error) {
        console.error("Error fetching clients:", error);
        return;
      }

      setClients(data as Client[]);
    };

    fetchClients();
  }, []);

  // Calculate total revenue
  const totalRevenue = trips?.reduce((sum, trip) => sum + trip.amount, 0) || 0;

  // Group trips by date for the calendar view
  const tripsByDate = trips?.reduce((acc: { [key: string]: any[] }, trip) => {
    const date = trip.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(trip);
    return acc;
  }, {});

  // Calculate calendar days
  let daysInInterval: Date[] = [];
  if (reportType === "monthly") {
    daysInInterval = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  } else {
    // For quarterly and yearly reports, generate a smaller set of dates for display
    const startDate = new Date(currentMonth.getFullYear(), 0, 1);
    const endDate = new Date(currentMonth.getFullYear(), 11, 31);
    const interval = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)); // Weekly intervals
    
    for (let i = 0; i <= interval; i++) {
      const date = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      daysInInterval.push(date);
    }
  }

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    if (clientId === "all") {
      setSelectedClient(null);
      setClientFilter("all");
    } else {
      const client = clients.find(c => c.id === clientId);
      setSelectedClient(client || null);
      setClientFilter(clientId);
    }
  };

  if (tripsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Reports</h2>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">Analyze trip data and generate reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="report_type">Report Type</Label>
          <select
            id="report_type"
            className="flex h-10 w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_filter">Client Filter</Label>
          <select
            id="client_filter"
            className="flex h-10 w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={clientFilter}
            onChange={(e) => handleClientChange(e.target.value)}
          >
            <option value="all">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trip Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              Previous
            </Button>
            <span className="font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-medium text-sm py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: getFirstDayOfMonth(startOfMonth(currentMonth)) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 p-1 border rounded-md bg-muted/30"></div>
            ))}

            {/* Calendar days */}
            {daysInInterval.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayTrips = tripsByDate ? tripsByDate[dateStr] || [] : [];

              return (
                <div
                  key={day.toString()}
                  className={`h-24 p-1 border rounded-md overflow-hidden ${isSameDay(day, new Date()) ? "bg-blue-50 border-blue-200" : ""
                    }`}
                >
                  <div className="font-medium text-sm mb-1">
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[calc(100%-22px)]">
                    {dayTrips.slice(0, 3).map((trip: any) => (
                      <div
                        key={trip.id}
                        className="text-xs p-1 rounded cursor-pointer bg-primary/10 truncate"
                      >
                        {trip.clients?.name}
                      </div>
                    ))}
                    {dayTrips.length > 3 && (
                      <div className="text-xs text-center text-muted-foreground">
                        +{dayTrips.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Total Revenue</Label>
              <div className="text-2xl font-semibold">{formatCurrency(totalRevenue)}</div>
            </div>
            <div>
              <Label>Total Trips</Label>
              <div className="text-2xl font-semibold">{trips?.length || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips?.map((trip: any) => (
                <TableRow key={trip.id}>
                  <TableCell>{formatDate(trip.date)}</TableCell>
                  <TableCell>{trip.clients?.name}</TableCell>
                  <TableCell>{trip.type}</TableCell>
                  <TableCell>{formatCurrency(trip.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadgeClass(trip.status || 'scheduled')}>
                      {formatStatus(trip.status || 'scheduled')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
