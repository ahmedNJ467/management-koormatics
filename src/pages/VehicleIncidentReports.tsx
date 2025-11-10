import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
  Filter,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
 
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isValid } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { IncidentReportForm } from "@/components/incident-reports/IncidentReportForm";
import { IncidentDetailsDialog } from "@/components/incident-reports/IncidentDetailsDialog";
import {
  generateIncidentReportPdf,
  exportIncidentReportsListToPDF,
} from "@/components/incident-reports/utils/incidentPdfExport";

interface VehicleIncidentReport {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  incident_date: string;
  incident_time: string;
  incident_type:
    | "accident"
    | "theft"
    | "vandalism"
    | "breakdown"
    | "traffic_violation"
    | "other";
  severity: "minor" | "moderate" | "severe" | "critical";
  status: "reported" | "investigating" | "resolved" | "closed";
  location: string;
  description: string;
  injuries_reported: boolean;
  police_report_number?: string;
  insurance_claim_number?: string;
  estimated_damage_cost?: number;
  actual_repair_cost?: number;
  third_party_involved: boolean;
  third_party_details?: string;
  witness_details?: string;
  photos_attached: boolean;
  reported_by: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  vehicle?: {
    make: string;
    model: string;
    registration: string;
  };
  driver?: {
    name: string;
    license_number: string;
  };
}

export default function VehicleIncidentReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] =
    useState<VehicleIncidentReport | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] =
    useState<VehicleIncidentReport | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>();

  // Fetch incident reports
  const { data: incidentReports, isLoading } = useQuery({
    queryKey: ["vehicle-incident-reports"],
    queryFn: async () => {
      // Fetch incident reports first
      const { data: reports, error: reportsError } = await supabase
        .from("vehicle_incident_reports")
        .select("*")
        .order("incident_date", { ascending: false });

      if (reportsError) {
        console.error("Error fetching incident reports:", {
          message: reportsError.message,
          code: reportsError.code,
          details: reportsError.details,
          hint: reportsError.hint,
          error: reportsError,
        });
        throw reportsError;
      }

      // Fetch vehicles data
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, make, model, registration");

      if (vehiclesError) throw vehiclesError;

      // Fetch drivers data
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("id, name, license_number");

      if (driversError) throw driversError;

      // Create lookup maps
      const vehiclesMap = new Map(vehiclesData?.map(v => [v.id, v]) || []);
      const driversMap = new Map(driversData?.map(d => [d.id, d]) || []);

      // Combine the data
      const enrichedReports = reports?.map(report => ({
        ...report,
        vehicle: report.vehicle_id ? vehiclesMap.get(report.vehicle_id) : null,
        driver: report.driver_id ? driversMap.get(report.driver_id) : null,
      })) || [];

      return enrichedReports as any;
    },
  });

  // Fetch vehicles for filter dropdown
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration")
        .order("make");
      if (error) throw error;
      return data;
    },
  });

  // Filter incident reports
  const filteredReports = useMemo(() => {
    if (!incidentReports) return [];

    return incidentReports.filter((report: any) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleName = report.vehicle
          ? `${report.vehicle.make} ${report.vehicle.model}`.toLowerCase()
          : "";
        const registration = report.vehicle?.registration?.toLowerCase() || "";
        const location = report.location.toLowerCase();
        const reporter = report.reported_by.toLowerCase();

        if (
          !vehicleName.includes(searchLower) &&
          !registration.includes(searchLower) &&
          !location.includes(searchLower) &&
          !reporter.includes(searchLower)
        ) {
          return false;
        }
      }

      // Vehicle filter
      if (vehicleFilter !== "all" && report.vehicle_id !== vehicleFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && report.incident_type !== typeFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== "all" && report.severity !== severityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && report.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const reportDate = parseISO(report.incident_date);
        if (dateRange.from && reportDate < dateRange.from) return false;
        if (dateRange.to && reportDate > dateRange.to) return false;
      }

      return true;
    });
  }, [
    incidentReports,
    searchTerm,
    vehicleFilter,
    typeFilter,
    severityFilter,
    statusFilter,
    dateRange,
  ]);

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 20;
  const totalPages = Math.ceil((filteredReports?.length || 0) / reportsPerPage);
  const startIndex = (currentPage - 1) * reportsPerPage;
  const endIndex = startIndex + reportsPerPage;
  const paginatedReports = filteredReports?.slice(startIndex, endIndex) || [];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    vehicleFilter,
    typeFilter,
    severityFilter,
    statusFilter,
    dateRange,
  ]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredReports)
      return {
        total: 0,
        thisMonth: 0,
        severe: 0,
        pending: 0,
        totalCost: 0,
      };

    const thisMonth = new Date();
    thisMonth.setDate(1);

    const thisMonthReports = filteredReports.filter(
      (r: any) => parseISO(r.incident_date) >= thisMonth
    ).length;

    const severeReports = filteredReports.filter(
      (r: any) => r.severity === "severe" || r.severity === "critical"
    ).length;

    const pendingReports = filteredReports.filter(
      (r: any) => r.status === "reported" || r.status === "investigating"
    ).length;

    const totalCost = filteredReports.reduce(
      (sum: any, r: any) =>
        sum + (r.actual_repair_cost || r.estimated_damage_cost || 0),
      0
    );

    return {
      total: filteredReports.length,
      thisMonth: thisMonthReports,
      severe: severeReports,
      pending: pendingReports,
      totalCost,
    };
  }, [filteredReports]);

  // Delete incident report mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vehicle_incident_reports")
        .delete()
        .eq("id", id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-incident-reports"] });
      toast({
        title: "Incident report deleted",
        description: "The incident report has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete incident report",
        variant: "destructive",
      });
    },
  });

  const openDeleteDialog = (report: VehicleIncidentReport) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  };

  const confirmDelete = () => {
    if (!reportToDelete) return;
    deleteMutation.mutate(reportToDelete.id, {
      onSettled: () => {
        closeDeleteDialog();
      },
    });
  };

  const handleViewDetails = (report: VehicleIncidentReport) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const handleEditReport = (report: VehicleIncidentReport) => {
    setSelectedReport(report);
    setFormOpen(true);
  };

  const exportSelectedReportPdf = async () => {
    if (!selectedReport) return;
    const report = selectedReport as any;
    try {
      const exportData = {
        ...report,
        driver: report.driver
          ? {
              name: report.driver.name,
              license_number: report.driver.license_number,
            }
          : undefined,
        vehicle: report.vehicle
          ? {
              make: report.vehicle.make,
              model: report.vehicle.model,
              registration: report.vehicle.registration,
            }
          : undefined,
      } as any;
      try {
        const { data: dbImages } = await supabase
          .from("vehicle_incident_images")
          .select("image_url, name")
          .eq("incident_id", report.id as any);
        if (dbImages && dbImages.length > 0) {
          (exportData as any).photos = dbImages.map((r: any) => ({
            url: r.image_url,
            name: r.name ?? undefined,
          }));
        }
      } catch {}
      await generateIncidentReportPdf(exportData, {
        logoUrl: window.location.origin + "/images/Koormatics-logo.png",
      });
      toast({
        title: "PDF exported successfully",
        description: "Incident report has been exported to PDF.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export failed",
        description:
          "Failed to export incident report to PDF. Please try again.",
        variant: "destructive",
      });
    }
  };
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "minor":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Minor
          </Badge>
        );
      case "moderate":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Moderate
          </Badge>
        );
      case "severe":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            Severe
          </Badge>
        );
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Critical
          </Badge>
        );
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reported":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Reported
          </Badge>
        );
      case "investigating":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Investigating
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Resolved
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Closed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      accident: "Accident",
      theft: "Theft",
      vandalism: "Vandalism",
      breakdown: "Breakdown",
      traffic_violation: "Traffic Violation",
      other: "Other",
    };

    const typeColors = {
      accident: "bg-red-100 text-red-800",
      theft: "bg-purple-100 text-purple-800",
      vandalism: "bg-orange-100 text-orange-800",
      breakdown: "bg-blue-100 text-blue-800",
      traffic_violation: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        className={`${typeColors[type as keyof typeof typeColors]} hover:${
          typeColors[type as keyof typeof typeColors]
        }`}
      >
        {typeLabels[type as keyof typeof typeLabels] || type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid Date";
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Invalid Date";

    const dateStr = format(date, "dd/MM/yyyy");
    return timeString ? `${dateStr} ${timeString}` : dateStr;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setVehicleFilter("all");
    setTypeFilter("all");
    setSeverityFilter("all");
    setStatusFilter("all");
    setDateRange(undefined);
  };

  const exportToCSV = () => {
    if (!filteredReports || filteredReports.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no incident reports to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Date",
      "Time",
      "Vehicle",
      "Registration",
      "Type",
      "Severity",
      "Status",
      "Location",
      "Reported By",
      "Estimated Cost",
      "Actual Cost",
      "Police Report",
      "Insurance Claim",
      "Description",
    ];

    const csvData = filteredReports.map((report: any) => [
      formatDate(report.incident_date),
      report.incident_time || "",
      report.vehicle
        ? `${report.vehicle.make} ${report.vehicle.model}`
        : "Unknown",
      report.vehicle?.registration || "",
      report.incident_type,
      report.severity,
      report.status,
      report.location,
      report.reported_by,
      report.estimated_damage_cost?.toString() || "",
      report.actual_repair_cost?.toString() || "",
      report.police_report_number || "",
      report.insurance_claim_number || "",
      report.description || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell: any) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-reports-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${filteredReports.length} incident reports to CSV.`,
    });
  };

  const exportToPDF = async () => {
    if (!filteredReports || filteredReports.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no incident reports to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Transform the data to match the expected interface
      const exportData = filteredReports.map((report: any) => ({
        ...report,
        driver: report.driver
          ? {
              name: report.driver.name,
              license_number: report.driver.license_number,
            }
          : undefined,
        vehicle: report.vehicle
          ? {
              make: report.vehicle.make,
              model: report.vehicle.model,
              registration: report.vehicle.registration,
            }
          : undefined,
      }));

      await exportIncidentReportsListToPDF(exportData);
      toast({
        title: "PDF exported successfully",
        description: "Incident reports summary has been exported to PDF.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export failed",
        description:
          "Failed to export incident reports to PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const hasActiveFilters =
    !!searchTerm ||
    vehicleFilter !== "all" ||
    typeFilter !== "all" ||
    severityFilter !== "all" ||
    statusFilter !== "all" ||
    !!dateRange?.from ||
    !!dateRange?.to;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Vehicle Incident Reports
              </h1>
            </div>
            <Button
              onClick={() => {
                setSelectedReport(null);
                setFormOpen(true);
              }}
              variant="outline"
              className="h-9 px-4"
            >
              New Incident Report
            </Button>
          </div>
        </div>

        {/* Summary cards removed to match Vehicle Inspections minimalist header */}

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle, location, or reporter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles?.map((vehicle) => (
                  <SelectItem
                    key={(vehicle as any).id}
                    value={(vehicle as any).id}
                  >
                    {(vehicle as any).make} {(vehicle as any).model} (
                    {(vehicle as any).registration})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="theft">Theft</SelectItem>
                <SelectItem value="vandalism">Vandalism</SelectItem>
                <SelectItem value="breakdown">Breakdown</SelectItem>
                <SelectItem value="traffic_violation">
                  Traffic Violation
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-[240px]"
            />

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Results summary removed per request */}
        </div>

        {/* Reports Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No incident reports found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedReports?.map((report: any) => (
                      <TableRow
                        key={report.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleViewDetails(report)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleViewDetails(report);
                          }
                        }}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatDate(report.incident_date)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {report.incident_time || "Time not specified"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">
                            {report.id
                              ?.replace(/[^a-zA-Z0-9]/g, "")
                              .slice(0, 8)
                              .toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {report.vehicle
                                ? `${report.vehicle.make} ${report.vehicle.model}`
                                : "Unknown Vehicle"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {report.vehicle?.registration}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(report.incident_type)}
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(report.severity)}
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{report.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {report.actual_repair_cost ? (
                              <span className="font-medium">
                                ${report.actual_repair_cost.toLocaleString()}
                              </span>
                            ) : report.estimated_damage_cost ? (
                              <span className="text-muted-foreground">
                                ~$
                                {report.estimated_damage_cost.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Not assessed
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination summary removed per request; keeping only controls below */}

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

        {/* Form Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedReport
                  ? "Edit Incident Report"
                  : "New Incident Report"}
              </DialogTitle>
              <DialogDescription>
                {selectedReport
                  ? "Update the incident report details and status."
                  : "Create a new incident report for vehicle-related incidents."}
              </DialogDescription>
            </DialogHeader>
            <IncidentReportForm
              report={selectedReport}
              onSuccess={() => {
                setFormOpen(false);
                setSelectedReport(null);
                queryClient.invalidateQueries({
                  queryKey: ["vehicle-incident-reports"],
                });
              }}
              onCancel={() => {
                setFormOpen(false);
                setSelectedReport(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setReportToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Incident Report</AlertDialogTitle>
              <AlertDialogDescription>
                {reportToDelete
                  ? `Are you sure you want to delete the incident report for ${
                      reportToDelete.vehicle
                        ? `${reportToDelete.vehicle.make} ${reportToDelete.vehicle.model} (${reportToDelete.vehicle.registration})`
                        : "this vehicle"
                    }? This action cannot be undone.`
                  : "Are you sure you want to delete this incident report? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => closeDeleteDialog()}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Details Dialog */}
        <IncidentDetailsDialog
          report={selectedReport}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onEdit={() => {
            if (selectedReport) handleEditReport(selectedReport as any);
          }}
          onDelete={() => {
            if (selectedReport) openDeleteDialog(selectedReport as any);
          }}
          onDownloadPdf={exportSelectedReportPdf}
        />
      </div>
    </div>
  );
}
