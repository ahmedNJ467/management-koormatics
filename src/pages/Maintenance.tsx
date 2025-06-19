import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Calendar,
  FileWarning,
  Download,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaintenanceFormDialog } from "@/components/maintenance-form-dialog";
import type { Maintenance } from "@/lib/types";
import { MaintenanceStatusBadge } from "@/components/maintenance-form/maintenance-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Maintenance() {
  const queryClient = useQueryClient();
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Maintenance>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select(
          `
          *,
          vehicle:vehicles (
            id,
            make,
            model,
            registration
          )
        `
        )
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Maintenance[];
    },
  });

  const handleMaintenanceDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    setSelectedRecord(undefined);
  };

  const handleRowClick = (record: Maintenance) => {
    // Don't allow editing completed maintenance records
    if (record.status === "completed") {
      return;
    }
    setSelectedRecord(record);
  };

  const filteredRecords = maintenanceRecords?.filter((record) => {
    const matchesSearch =
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.vehicle?.registration
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      record.service_provider?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;

    const recordDate = new Date(record.date);
    const matchesDateFrom = !dateFrom || recordDate >= dateFrom;
    const matchesDateTo = !dateTo || recordDate <= dateTo;

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  // Calculate summary statistics
  const totalCost =
    filteredRecords?.reduce((sum, record) => sum + record.cost, 0) || 0;
  const completedCount =
    filteredRecords?.filter((record) => record.status === "completed").length ||
    0;
  const upcomingCount =
    filteredRecords?.filter((record) => {
      const recordDate = new Date(record.date);
      const today = new Date();
      return record.status === "scheduled" && recordDate >= today;
    }).length || 0;
  const averageCost =
    filteredRecords && filteredRecords.length > 0
      ? totalCost / filteredRecords.length
      : 0;

  const exportToCSV = () => {
    if (!filteredRecords) return;

    const headers = [
      "Date",
      "Vehicle",
      "Description",
      "Service Provider",
      "Status",
      "Cost",
      "Next Scheduled",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map((record) =>
        [
          new Date(record.date).toLocaleDateString(),
          record.vehicle
            ? `${record.vehicle.make} ${record.vehicle.model} - ${record.vehicle.registration}`
            : "Unknown Vehicle",
          `"${record.description}"`,
          record.service_provider || "",
          record.status,
          record.cost,
          record.next_scheduled
            ? new Date(record.next_scheduled).toLocaleDateString()
            : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maintenance-records-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in_progress":
        return "text-blue-600";
      case "scheduled":
        return "text-yellow-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Maintenance</h2>
          <p className="text-muted-foreground">
            Track vehicle maintenance records
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 text-white border-white/20"
            onClick={exportToCSV}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button
            onClick={() => setIsAddingRecord(true)}
            variant="outline"
            size="lg"
            className="gap-2 text-white border-white/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Record
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredRecords?.length || 0} maintenance records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              {filteredRecords && filteredRecords.length > 0
                ? `${((completedCount / filteredRecords.length) * 100).toFixed(
                    1
                  )}% completion rate`
                : "No records"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled maintenance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {averageCost.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Per maintenance record
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !dateFrom && !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? (
                dateTo ? (
                  <>
                    {format(dateFrom, "LLL dd, y")} -{" "}
                    {format(dateTo, "LLL dd, y")}
                  </>
                ) : (
                  format(dateFrom, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={dateFrom}
              selected={{ from: dateFrom, to: dateTo }}
              onSelect={(range) => {
                setDateFrom(range?.from);
                setDateTo(range?.to);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          className="border border-input/30"
          onClick={clearAllFilters}
        >
          Clear Filters
        </Button>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Service Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Expense (USD)</TableHead>
              <TableHead>Next Scheduled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading records...
                </TableCell>
              </TableRow>
            ) : filteredRecords?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FileWarning className="w-10 h-10 text-muted-foreground mb-2" />
                    <span className="text-lg font-medium">
                      No maintenance records found.
                    </span>
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2 mt-2 text-white border-white/20"
                      onClick={() => setIsAddingRecord(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add your first record
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords?.map((record) => (
                <TableRow
                  key={record.id}
                  className={`${
                    record.status === "completed"
                      ? "opacity-75"
                      : "cursor-pointer hover:bg-muted/50"
                  }`}
                  onClick={() => handleRowClick(record)}
                  title={
                    record.status === "completed"
                      ? "Completed maintenance records cannot be edited"
                      : "Click to edit"
                  }
                >
                  <TableCell>
                    {new Date(record.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {record.vehicle
                      ? `${record.vehicle.make} ${record.vehicle.model} - ${record.vehicle.registration}`
                      : "Unknown Vehicle"}
                  </TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{record.service_provider || "-"}</TableCell>
                  <TableCell>
                    <MaintenanceStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    $
                    {record.cost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    {record.next_scheduled
                      ? new Date(record.next_scheduled).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MaintenanceFormDialog
        open={isAddingRecord || !!selectedRecord}
        onOpenChange={(open) => {
          setIsAddingRecord(open);
          if (!open) setSelectedRecord(undefined);
        }}
        maintenance={selectedRecord}
        onMaintenanceDeleted={handleMaintenanceDeleted}
      />
    </div>
  );
}
