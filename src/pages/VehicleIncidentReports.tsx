import React, { useState, useMemo } from "react";
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
  Plus,
  AlertTriangle,
  Car,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isValid } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { IncidentReportForm } from "@/components/incident-reports/IncidentReportForm";
import { IncidentDetailsDialog } from "@/components/incident-reports/IncidentDetailsDialog";
import {
  exportIncidentReportToPDF,
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
      const { data, error } = await supabase
        .from("vehicle_incident_reports")
        .select(
          `
          *,
          vehicle:vehicles (
            make,
            model,
            registration
          ),
          driver:drivers (
            name,
            license_number
          )
        `
        )
        .order("incident_date", { ascending: false });

      if (error) throw error;
      return data as VehicleIncidentReport[];
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

    return incidentReports.filter((report) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleName = report.vehicle
          ? `${report.vehicle.make} ${report.vehicle.model}`.toLowerCase()
          : "";
        const registration = report.vehicle?.registration?.toLowerCase() || "";
        const location = report.location.toLowerCase();
        const reportedBy = report.reported_by.toLowerCase();

        if (
          !vehicleName.includes(searchLower) &&
          !registration.includes(searchLower) &&
          !location.includes(searchLower) &&
          !reportedBy.includes(searchLower)
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
        const incidentDate = parseISO(report.incident_date);
        if (dateRange.from && incidentDate < dateRange.from) return false;
        if (dateRange.to && incidentDate > dateRange.to) return false;
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
      (r) => parseISO(r.incident_date) >= thisMonth
    ).length;

    const severeReports = filteredReports.filter(
      (r) => r.severity === "severe" || r.severity === "critical"
    ).length;

    const pendingReports = filteredReports.filter(
      (r) => r.status === "reported" || r.status === "investigating"
    ).length;

    const totalCost = filteredReports.reduce(
      (sum, r) => sum + (r.actual_repair_cost || r.estimated_damage_cost || 0),
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete incident report",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this incident report?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (report: VehicleIncidentReport) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const handleEditReport = (report: VehicleIncidentReport) => {
    setSelectedReport(report);
    setFormOpen(true);
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

    const csvData = filteredReports.map((report) => [
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
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
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

  const exportToPDF = () => {
    if (!filteredReports || filteredReports.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no incident reports to export.",
        variant: "destructive",
      });
      return;
    }

    // Transform the data to match the expected interface
    const exportData = filteredReports.map((report) => ({
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

    exportIncidentReportsListToPDF(exportData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Vehicle Incident Reports
          </h2>
          <p className="text-muted-foreground">
            Track and manage vehicle incidents, accidents, and insurance claims
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedReport(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          New Incident Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summaryStats.thisMonth}
            </div>
            <p className="text-xs text-muted-foreground">New incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Severe/Critical
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryStats.severe}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summaryStats.pending}
            </div>
            <p className="text-xs text-muted-foreground">Open cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summaryStats.totalCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Repair costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
                    {vehicle.make} {vehicle.model} ({vehicle.registration})
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

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading incident reports...
                    </TableCell>
                  </TableRow>
                ) : filteredReports?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No incident reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports?.map((report) => (
                    <TableRow key={report.id}>
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
                      <TableCell>{getSeverityBadge(report.severity)}</TableCell>
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
                              ~${report.estimated_damage_cost.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Not assessed
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(report)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditReport(report)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const exportData = {
                                  ...report,
                                  driver: report.driver
                                    ? {
                                        name: report.driver.name,
                                        license_number:
                                          report.driver.license_number,
                                      }
                                    : undefined,
                                  vehicle: report.vehicle
                                    ? {
                                        make: report.vehicle.make,
                                        model: report.vehicle.model,
                                        registration:
                                          report.vehicle.registration,
                                      }
                                    : undefined,
                                };
                                exportIncidentReportToPDF(exportData);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(report.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

      {/* Details Dialog */}
      <IncidentDetailsDialog
        report={selectedReport}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
