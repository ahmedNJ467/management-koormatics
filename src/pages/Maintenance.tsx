import { useState, useEffect } from "react";
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
  Search,
  X,
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
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { safeArrayResult } from "@/lib/utils/type-guards";

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
          id,
          vehicle_id,
          date,
          description,
          expense,
          status,
          service_provider,
          notes,
          created_at,
          updated_at,
          next_scheduled,
          vehicles!maintenance_vehicle_id_fkey (
            id,
            make,
            model,
            registration
          )
        `
        )
        .order("date", { ascending: false });

      if (error) throw error;
      // Transform vehicles to vehicle (column names now match form fields exactly)
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        vehicle: item.vehicles || null,
      }));
      return safeArrayResult<Maintenance>(transformedData);
    },
  });

  const handleMaintenanceDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    setSelectedRecord(undefined);
  };

  const handleRowClick = (record: Maintenance) => {
    // Allow viewing all maintenance records (completed ones will be read-only in the dialog)
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

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const maintenancePerPage = 20;
  const totalPages = Math.ceil(
    (filteredRecords?.length || 0) / maintenancePerPage
  );
  const startIndex = (currentPage - 1) * maintenancePerPage;
  const endIndex = startIndex + maintenancePerPage;
  const paginatedRecords = filteredRecords?.slice(startIndex, endIndex) || [];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  // Calculate summary statistics
  const totalCost =
    filteredRecords?.reduce((sum, record) => sum + record.expense, 0) || 0;
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
          record.expense,
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
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Maintenance
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-foreground border-border/50"
                onClick={exportToCSV}
              >
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button
                onClick={() => setIsAddingRecord(true)}
                variant="outline"
                size="sm"
                className="text-foreground border-border/50"
              >
                Add Record
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Section */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 border-border/50 focus:border-primary/50 transition-all duration-200"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-muted/50"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filters Section */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-11 border-border/50 focus:border-primary/50">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
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
                        "w-[200px] h-11 justify-start text-left font-normal border-border/50 focus:border-primary/50",
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
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== "all" || dateFrom || dateTo) && (
            <div className="flex items-center justify-between pt-3 border-t border-border/20">
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchTerm}"
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter.replace("_", " ")}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setStatusFilter("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="secondary" className="gap-1">
                    From: {format(dateFrom, "LLL dd, y")}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setDateFrom(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="gap-1">
                    To: {format(dateTo, "LLL dd, y")}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setDateTo(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          )}
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
              {paginatedRecords?.length === 0 ? (
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
                        Add your first record
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords?.map((record) => (
                  <TableRow
                    key={record.id}
                    className={`${"cursor-pointer hover:bg-muted/50"} ${
                      record.status === "completed" ? "opacity-75" : ""
                    }`}
                    onClick={() => handleRowClick(record)}
                    title={
                      record.status === "completed"
                        ? "Click to view completed record (read-only)"
                        : "Click to edit record"
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
                      {record.expense.toLocaleString(undefined, {
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

        {/* Results Count and Pagination Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredRecords?.length || 0)} of{" "}
              {filteredRecords?.length || 0} maintenance records
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  if (totalPages <= 5) {
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  }

                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  }

                  if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span
                        key={pageNum}
                        className="px-2 text-muted-foreground"
                      >
                        ...
                      </span>
                    );
                  }

                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>

            {/* Timestamp at bottom */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>•</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}

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
    </div>
  );
}
