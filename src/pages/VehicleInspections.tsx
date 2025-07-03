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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Car,
  Calendar,
  User,
  FileText,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
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
import { VehicleInspectionForm } from "@/components/vehicle-inspections/VehicleInspectionForm";
import { InspectionDetailsDialog } from "@/components/vehicle-inspections/InspectionDetailsDialog";

interface VehicleInspection {
  id: string;
  vehicle_id: string;
  inspector_name: string;
  inspection_date: string;
  pre_trip: boolean;
  post_trip: boolean;
  overall_status: "pass" | "fail" | "conditional";
  mileage: number;
  fuel_level: number;
  engine_oil: "good" | "low" | "needs_change";
  coolant: "good" | "low" | "needs_refill";
  brake_fluid: "good" | "low" | "needs_refill";
  tires_condition: "good" | "fair" | "poor";
  lights_working: boolean;
  brakes_working: boolean;
  steering_working: boolean;
  horn_working: boolean;
  wipers_working: boolean;
  mirrors_clean: boolean;
  seatbelts_working: boolean;
  first_aid_kit: boolean;
  fire_extinguisher: boolean;
  warning_triangle: boolean;
  jack_spare_tire: boolean;
  documents_present: boolean;
  interior_clean: boolean;
  exterior_clean: boolean;
  defects_noted: string;
  corrective_actions: string;
  notes: string;
  created_at: string;
  vehicle?: {
    make: string;
    model: string;
    registration: string;
  };
}

export default function VehicleInspections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] =
    useState<VehicleInspection | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inspectorFilter, setInspectorFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>();

  // Fetch inspections
  const { data: inspections, isLoading } = useQuery({
    queryKey: ["vehicle-inspections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_inspections")
        .select(
          `
          *,
          vehicle:vehicles (
            make,
            model,
            registration
          )
        `
        )
        .order("inspection_date", { ascending: false });

      if (error) throw error;
      return data as VehicleInspection[];
    },
  });

  // Fetch vehicles for filter dropdown
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-inspection"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration")
        .order("make");
      if (error) throw error;
      return data;
    },
  });

  // Get unique inspectors for filter
  const inspectors = useMemo(() => {
    if (!inspections) return [];
    const uniqueInspectors = new Set(inspections.map((i) => i.inspector_name));
    return Array.from(uniqueInspectors);
  }, [inspections]);

  // Filter inspections
  const filteredInspections = useMemo(() => {
    if (!inspections) return [];

    return inspections.filter((inspection) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleName = inspection.vehicle
          ? `${inspection.vehicle.make} ${inspection.vehicle.model}`.toLowerCase()
          : "";
        const registration =
          inspection.vehicle?.registration?.toLowerCase() || "";
        const inspector = inspection.inspector_name.toLowerCase();

        if (
          !vehicleName.includes(searchLower) &&
          !registration.includes(searchLower) &&
          !inspector.includes(searchLower)
        ) {
          return false;
        }
      }

      // Vehicle filter
      if (vehicleFilter !== "all" && inspection.vehicle_id !== vehicleFilter) {
        return false;
      }

      // Status filter
      if (
        statusFilter !== "all" &&
        inspection.overall_status !== statusFilter
      ) {
        return false;
      }

      // Inspector filter
      if (
        inspectorFilter !== "all" &&
        inspection.inspector_name !== inspectorFilter
      ) {
        return false;
      }

      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const inspectionDate = parseISO(inspection.inspection_date);
        if (dateRange.from && inspectionDate < dateRange.from) return false;
        if (dateRange.to && inspectionDate > dateRange.to) return false;
      }

      return true;
    });
  }, [
    inspections,
    searchTerm,
    vehicleFilter,
    statusFilter,
    inspectorFilter,
    dateRange,
  ]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredInspections)
      return {
        total: 0,
        passed: 0,
        failed: 0,
        conditional: 0,
        todayInspections: 0,
      };

    const today = new Date().toISOString().split("T")[0];
    const todayInspections = filteredInspections.filter(
      (i) => i.inspection_date === today
    ).length;

    return {
      total: filteredInspections.length,
      passed: filteredInspections.filter((i) => i.overall_status === "pass")
        .length,
      failed: filteredInspections.filter((i) => i.overall_status === "fail")
        .length,
      conditional: filteredInspections.filter(
        (i) => i.overall_status === "conditional"
      ).length,
      todayInspections,
    };
  }, [filteredInspections]);

  // Delete inspection mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vehicle_inspections")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inspections"] });
      toast({
        title: "Inspection deleted",
        description: "The vehicle inspection has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete inspection",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this inspection?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (inspection: VehicleInspection) => {
    setSelectedInspection(inspection);
    setDetailsOpen(true);
  };

  const handleEditInspection = (inspection: VehicleInspection) => {
    setSelectedInspection(inspection);
    setFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Pass
          </Badge>
        );
      case "fail":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Fail
          </Badge>
        );
      case "conditional":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Conditional
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid Date";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setVehicleFilter("all");
    setStatusFilter("all");
    setInspectorFilter("all");
    setDateRange(undefined);
  };

  const exportToCSV = () => {
    if (!filteredInspections || filteredInspections.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no inspections to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Date",
      "Vehicle",
      "Registration",
      "Inspector",
      "Status",
      "Mileage",
      "Fuel Level",
      "Engine Oil",
      "Defects Noted",
      "Actions Required",
    ];

    const csvData = filteredInspections.map((inspection) => [
      formatDate(inspection.inspection_date),
      inspection.vehicle
        ? `${inspection.vehicle.make} ${inspection.vehicle.model}`
        : "Unknown",
      inspection.vehicle?.registration || "",
      inspection.inspector_name,
      inspection.overall_status,
      inspection.mileage?.toString() || "",
      `${inspection.fuel_level}%`,
      inspection.engine_oil,
      inspection.defects_noted || "",
      inspection.corrective_actions || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vehicle-inspections-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${filteredInspections.length} inspections to CSV.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Vehicle Inspections
          </h2>
          <p className="text-muted-foreground">
            Daily vehicle inspection checklists and safety records
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedInspection(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          New Inspection
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inspections
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryStats.passed}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.total > 0
                ? Math.round((summaryStats.passed / summaryStats.total) * 100)
                : 0}
              % pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryStats.failed}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conditional</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summaryStats.conditional}
            </div>
            <p className="text-xs text-muted-foreground">Minor issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summaryStats.todayInspections}
            </div>
            <p className="text-xs text-muted-foreground">
              Inspections completed
            </p>
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
                  placeholder="Search by vehicle, registration, or inspector..."
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
                <SelectItem value="conditional">Conditional</SelectItem>
              </SelectContent>
            </Select>

            <Select value={inspectorFilter} onValueChange={setInspectorFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Inspectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inspectors</SelectItem>
                {inspectors.map((inspector) => (
                  <SelectItem key={inspector} value={inspector}>
                    {inspector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              className="w-[240px]"
            />

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspections Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Fuel Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading inspections...
                    </TableCell>
                  </TableRow>
                ) : filteredInspections?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No inspections found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInspections?.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell>
                        {formatDate(inspection.inspection_date)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {inspection.vehicle
                              ? `${inspection.vehicle.make} ${inspection.vehicle.model}`
                              : "Unknown Vehicle"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {inspection.vehicle?.registration}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {inspection.inspector_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(inspection.overall_status)}
                      </TableCell>
                      <TableCell>
                        {inspection.mileage?.toLocaleString()} km
                      </TableCell>
                      <TableCell>{inspection.fuel_level}%</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {inspection.pre_trip && (
                            <Badge variant="outline" className="text-xs">
                              Pre
                            </Badge>
                          )}
                          {inspection.post_trip && (
                            <Badge variant="outline" className="text-xs">
                              Post
                            </Badge>
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
                              onClick={() => handleViewDetails(inspection)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditInspection(inspection)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(inspection.id)}
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
              {selectedInspection
                ? "Edit Vehicle Inspection"
                : "New Vehicle Inspection"}
            </DialogTitle>
            <DialogDescription>
              {selectedInspection
                ? "Update the vehicle inspection details and safety checklist."
                : "Complete the daily vehicle inspection checklist for safety compliance."}
            </DialogDescription>
          </DialogHeader>
          <VehicleInspectionForm
            inspection={selectedInspection}
            onSuccess={() => {
              setFormOpen(false);
              setSelectedInspection(null);
              queryClient.invalidateQueries({
                queryKey: ["vehicle-inspections"],
              });
            }}
            onCancel={() => {
              setFormOpen(false);
              setSelectedInspection(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <InspectionDetailsDialog
        inspection={selectedInspection}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
