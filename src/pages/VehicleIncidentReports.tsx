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
  incident_type: "accident" | "theft" | "vandalism" | "breakdown" | "traffic_violation" | "other";
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

// Helper function to safely get string value
const safeString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
};

// Helper function to safely get number value
const safeNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export default function VehicleIncidentReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<VehicleIncidentReport | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<VehicleIncidentReport | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>();

  // Fetch incident reports with proper error handling
  const { data: incidentReports, isLoading } = useQuery({
    queryKey: ["vehicle-incident-reports"],
    queryFn: async () => {
      // Fetch incident reports
      const { data: reports, error: reportsError } = await supabase
        .from("vehicle_incident_reports")
        .select("*")
        .order("incident_date", { ascending: false });

      if (reportsError) {
        console.error("Error fetching incident reports:", reportsError);
        throw reportsError;
      }

      // Fetch vehicles data
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, make, model, registration");

      if (vehiclesError) {
        console.error("Error fetching vehicles:", vehiclesError);
        throw vehiclesError;
      }

      // Fetch drivers data
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("id, name, license_number");

      if (driversError) {
        console.error("Error fetching drivers:", driversError);
        throw driversError;
      }

      // Create lookup maps with proper filtering
      const vehiclesMap = new Map<string, { make: string; model: string; registration: string }>();
      (vehiclesData || []).forEach((v) => {
        if (v && v.id && typeof v.id === "string") {
          vehiclesMap.set(v.id, {
            make: safeString(v.make),
            model: safeString(v.model),
            registration: safeString(v.registration),
          });
        }
      });

      const driversMap = new Map<string, { name: string; license_number: string }>();
      (driversData || []).forEach((d) => {
        if (d && d.id && typeof d.id === "string") {
          driversMap.set(d.id, {
            name: safeString(d.name),
            license_number: safeString(d.license_number),
          });
        }
      });

      // Enrich reports with vehicle and driver data
      const enrichedReports: VehicleIncidentReport[] = (reports || [])
        .filter((report): report is NonNullable<typeof report> => {
          return report != null && typeof report === "object" && typeof report.id === "string";
        })
        .map((report) => {
          const vehicleId = typeof report.vehicle_id === "string" ? report.vehicle_id : null;
          const driverId = typeof report.driver_id === "string" ? report.driver_id : undefined;

          return {
            id: safeString(report.id),
            vehicle_id: safeString(report.vehicle_id),
            driver_id: driverId,
            incident_date: safeString(report.incident_date),
            incident_time: report.incident_time ? safeString(report.incident_time) : "",
            incident_type: (report.incident_type as VehicleIncidentReport["incident_type"]) || "other",
            severity: (report.severity as VehicleIncidentReport["severity"]) || "minor",
            status: (report.status as VehicleIncidentReport["status"]) || "reported",
            location: safeString(report.location),
            description: safeString(report.description),
            injuries_reported: Boolean(report.injuries_reported),
            police_report_number: report.police_report_number ? safeString(report.police_report_number) : undefined,
            insurance_claim_number: report.insurance_claim_number ? safeString(report.insurance_claim_number) : undefined,
            estimated_damage_cost: report.estimated_damage_cost ? safeNumber(report.estimated_damage_cost) : undefined,
            actual_repair_cost: report.actual_repair_cost ? safeNumber(report.actual_repair_cost) : undefined,
            third_party_involved: Boolean(report.third_party_involved),
            third_party_details: report.third_party_details ? safeString(report.third_party_details) : undefined,
            witness_details: report.witness_details ? safeString(report.witness_details) : undefined,
            photos_attached: Boolean(report.photos_attached),
            reported_by: safeString(report.reported_by),
            follow_up_required: Boolean(report.follow_up_required),
            follow_up_date: report.follow_up_date ? safeString(report.follow_up_date) : undefined,
            notes: report.notes ? safeString(report.notes) : undefined,
            created_at: safeString(report.created_at),
            updated_at: report.updated_at ? safeString(report.updated_at) : "",
            vehicle: vehicleId ? vehiclesMap.get(vehicleId) || undefined : undefined,
            driver: driverId ? driversMap.get(driverId) || undefined : undefined,
          };
        });

      return enrichedReports;
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
      return (data || []).filter((v) => v && v.id);
    },
  });

  // Filter incident reports with defensive programming
  const filteredReports = useMemo(() => {
    if (!incidentReports || !Array.isArray(incidentReports)) return [];

    const searchLower = searchTerm ? safeString(searchTerm).toLowerCase().trim() : "";

    return incidentReports.filter((report) => {
      if (!report || typeof report !== "object") return false;

      // Search filter
      if (searchLower) {
        const vehicleName = report.vehicle
          ? `${safeString(report.vehicle.make)} ${safeString(report.vehicle.model)}`.trim().toLowerCase()
          : "";
        const registration = report.vehicle ? safeString(report.vehicle.registration).toLowerCase() : "";
        const location = safeString(report.location).toLowerCase();
        const reporter = safeString(report.reported_by).toLowerCase();

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
        const incidentDate = safeString(report.incident_date);
        if (!incidentDate) return false;
        try {
          const reportDate = parseISO(incidentDate);
          if (!isValid(reportDate)) return false;
          if (dateRange.from && reportDate < dateRange.from) return false;
          if (dateRange.to && reportDate > dateRange.to) return false;
        } catch {
          return false;
        }
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
  }, [searchTerm, vehicleFilter, typeFilter, severityFilter, statusFilter, dateRange]);

  // Delete incident report mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vehicle_incident_reports")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-incident-reports"] });
      toast({
        title: "Incident report deleted",
        description: "The incident report has been deleted successfully.",
      });
    },
    onError: () => {
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
    try {
      const exportData = {
        ...selectedReport,
        incident_time: selectedReport.incident_time || undefined,
        driver: selectedReport.driver || undefined,
        vehicle: selectedReport.vehicle || undefined,
      };
      
      try {
        const { data: dbImages } = await supabase
          .from("vehicle_incident_images")
          .select("image_url, name")
          .eq("incident_id", selectedReport.id);
        if (dbImages && dbImages.length > 0) {
          (exportData as any).photos = dbImages.map((r) => ({
            url: r.image_url,
            name: r.name ?? undefined,
          }));
        }
      } catch (imageError) {
        console.error("Failed to load incident report photos:", imageError);
      }
      
      await generateIncidentReportPdf(exportData, {
        logoUrl: window.location.origin + "/logo.svg",
      });
      toast({
        title: "PDF exported successfully",
        description: "Incident report has been exported to PDF.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export failed",
        description: "Failed to export incident report to PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "minor":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Minor</Badge>;
      case "moderate":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Moderate</Badge>;
      case "severe":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Severe</Badge>;
      case "critical":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reported":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Reported</Badge>;
      case "investigating":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Investigating</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      accident: "Accident",
      theft: "Theft",
      vandalism: "Vandalism",
      breakdown: "Breakdown",
      traffic_violation: "Traffic Violation",
      other: "Other",
    };

    const typeColors: Record<string, string> = {
      accident: "bg-red-100 text-red-800",
      theft: "bg-purple-100 text-purple-800",
      vandalism: "bg-orange-100 text-orange-800",
      breakdown: "bg-blue-100 text-blue-800",
      traffic_violation: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={`${typeColors[type] || "bg-gray-100 text-gray-800"} hover:${typeColors[type] || "bg-gray-100 text-gray-800"}`}>
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Invalid Date";
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid Date";
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (!dateString) return "Invalid Date";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Invalid Date";
      const dateStr = format(date, "dd/MM/yyyy");
      return timeString ? `${dateStr} ${timeString}` : dateStr;
    } catch {
      return "Invalid Date";
    }
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

    const csvData = filteredReports.map((report) => [
      formatDate(report.incident_date),
      safeString(report.incident_time),
      report.vehicle ? `${safeString(report.vehicle.make)} ${safeString(report.vehicle.model)}` : "Unknown",
      report.vehicle ? safeString(report.vehicle.registration) : "",
      report.incident_type,
      report.severity,
      report.status,
      safeString(report.location),
      safeString(report.reported_by),
      report.estimated_damage_cost?.toString() || "",
      report.actual_repair_cost?.toString() || "",
      safeString(report.police_report_number),
      safeString(report.insurance_claim_number),
      safeString(report.description),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
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
      const exportData = filteredReports.map((report) => ({
        ...report,
        incident_time: report.incident_time || undefined,
        driver: report.driver || undefined,
        vehicle: report.vehicle || undefined,
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
        description: "Failed to export incident reports to PDF. Please try again.",
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
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {safeString(vehicle.make)} {safeString(vehicle.model)} ({safeString(vehicle.registration)})
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
                <SelectItem value="traffic_violation">Traffic Violation</SelectItem>
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : paginatedReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No incident reports found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedReports.map((report) => (
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
                            {report.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {report.vehicle
                                ? `${safeString(report.vehicle.make)} ${safeString(report.vehicle.model)}`
                                : "Unknown Vehicle"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {report.vehicle ? safeString(report.vehicle.registration) : ""}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(report.incident_type)}</TableCell>
                        <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{safeString(report.location)}</span>
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
                                ~${report.estimated_damage_cost.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not assessed</span>
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
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  }

                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  }

                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="px-2 text-muted-foreground">
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>

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
                {selectedReport ? "Edit Incident Report" : "New Incident Report"}
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
                queryClient.invalidateQueries({ queryKey: ["vehicle-incident-reports"] });
              }}
              onCancel={() => {
                setFormOpen(false);
                setSelectedReport(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Incident Report</AlertDialogTitle>
              <AlertDialogDescription>
                {reportToDelete
                  ? `Are you sure you want to delete the incident report for ${
                      reportToDelete.vehicle
                        ? `${safeString(reportToDelete.vehicle.make)} ${safeString(reportToDelete.vehicle.model)} (${safeString(reportToDelete.vehicle.registration)})`
                        : "this vehicle"
                    }? This action cannot be undone.`
                  : "Are you sure you want to delete this incident report? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteDialog} disabled={deleteMutation.isPending}>
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
            if (selectedReport) handleEditReport(selectedReport);
          }}
          onDelete={() => {
            if (selectedReport) openDeleteDialog(selectedReport);
          }}
          onDownloadPdf={exportSelectedReportPdf}
        />
      </div>
    </div>
  );
}

