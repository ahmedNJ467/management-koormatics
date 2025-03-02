import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { TripType, TripStatus, convertToDisplayTrips } from "@/lib/types/trip";

const Reports = () => {
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ["trips", date?.from, date?.to],
    queryFn: async () => {
      if (!date?.from || !date?.to) return [];

      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          vehicles(make, model),
          drivers(name),
          clients(name, type)
        `)
        .gte('date', format(date.from, 'yyyy-MM-dd'))
        .lte('date', format(date.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatTripType = (type: string): string => {
    if (!type) return "Transfer";

    switch (type) {
      case "airport_pickup":
        return "Airport Pickup";
      case "airport_dropoff":
        return "Airport Dropoff";
      case "other":
        return "Transfer";
      case "hourly":
        return "Hourly Service";
      case "full_day":
        return "Full Day Service";
      case "multi_day":
        return "Multi-Day Service";
      default:
        try {
          return type.replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        } catch (error) {
          console.error("Error formatting trip type:", error);
          return "Unknown Type";
        }
    }
  };

  const getStatusColor = (status: TripStatus): string => {
    if (!status) return "bg-gray-100 text-gray-700";

    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "in_progress":
        return "bg-purple-100 text-purple-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Process trips data for charts and tables
  const processTrips = () => {
    if (!tripsData) return {
      revenueByType: [],
      revenueByDate: [],
      tripsTableData: []
    };

    // Add type and status fields to all trips using convertToDisplayTrips
    const processedTrips = convertToDisplayTrips(tripsData || []);

    // Calculate revenue by trip type
    const revenueByType = processedTrips.reduce((acc: any, trip: any) => {
      const type = trip.type || 'other';
      const formattedType = formatTripType(type);
      if (!acc[formattedType]) {
        acc[formattedType] = { type: formattedType, revenue: 0 };
      }
      acc[formattedType].revenue += trip.amount;
      return acc;
    }, {});

    const revenueByTypeData = Object.values(revenueByType);

    // Calculate revenue by date
    const revenueByDate = processedTrips.reduce((acc: any, trip: any) => {
      const date = formatDate(trip.date);
      if (!acc[date]) {
        acc[date] = { date: date, revenue: 0 };
      }
      acc[date].revenue += trip.amount;
      return acc;
    }, {});

    const revenueByDateData = Object.values(revenueByDate);

    // Prepare data for trips table
    const tripsTableData = processedTrips.map((trip: any) => ({
      id: trip.id,
      date: formatDate(trip.date),
      client: trip.clients?.name || "Unknown Client",
      vehicle: trip.vehicles?.make + " " + trip.vehicles?.model || "Unknown Vehicle",
      driver: trip.drivers?.name || "Unknown Driver",
      type: formatTripType(trip.type),
      status: trip.status,
      amount: trip.amount,
      notes: trip.notes || trip.special_instructions || "No notes",
    }));

    return {
      revenueByType: revenueByTypeData,
      revenueByDate: revenueByDateData,
      tripsTableData: tripsTableData
    };
  };

  const { revenueByType, revenueByDate, tripsTableData } = processTrips();

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
        <DateRangePicker date={date} onDateChange={setDate} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Trip Type</CardTitle>
          <CardDescription>Overview of revenue generated by each trip type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Date</CardTitle>
          <CardDescription>Overview of revenue generated on each day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trips Data</CardTitle>
          <CardDescription>Detailed data for all trips within the selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTrips ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : tripsTableData.length > 0 ? (
                  tripsTableData.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>{trip.date}</TableCell>
                      <TableCell>{trip.client}</TableCell>
                      <TableCell>{trip.vehicle}</TableCell>
                      <TableCell>{trip.driver}</TableCell>
                      <TableCell>{trip.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(trip.status as TripStatus)}>
                          {trip.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(trip.amount)}</TableCell>
                      <TableCell>{trip.notes}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">No trips available for the selected date range</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
