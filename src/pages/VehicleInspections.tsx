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
  Plus,
  Search,
  Filter,
  Car,
  User,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  FileDown,
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
import { toShortId } from "@/utils/ids";
import { generateVehicleInspectionPdf } from "@/utils/pdf/vehicleInspectionPdf";

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

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const inspectionsPerPage = 20;
  const totalPages = Math.ceil(
    (filteredInspections?.length || 0) / inspectionsPerPage
  );
  const startIndex = (currentPage - 1) * inspectionsPerPage;
  const endIndex = startIndex + inspectionsPerPage;
  const paginatedInspections =
    filteredInspections?.slice(startIndex, endIndex) || [];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, vehicleFilter, statusFilter, inspectorFilter, dateRange]);

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

  const handleDownloadPdf = async (inspection: VehicleInspection) => {
    try {
      await generateVehicleInspectionPdf(inspection as any, {
        logoUrl:
          window.location.origin +
          "/lovable-uploads/3b576d68-bff3-4323-bab0-d4afcf9b85c2.png",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "PDF generation failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
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

  const hasActiveFilters =
    searchTerm ||
    vehicleFilter !== "all" ||
    statusFilter !== "all" ||
    inspectorFilter !== "all" ||
    dateRange?.from ||
    dateRange?.to;

  return (
            <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Vehicle Inspections
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedInspection(null);
              setFormOpen(true);
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Inspection
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

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
              <button
                onClick={() => setSearchTerm("")}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          {vehicleFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Vehicle: {vehicles?.find((v) => v.id === vehicleFilter)?.make}{" "}
              {vehicles?.find((v) => v.id === vehicleFilter)?.model}
              <button
                onClick={() => setVehicleFilter("all")}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <button
                onClick={() => setStatusFilter("all")}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          {inspectorFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Inspector: {inspectorFilter}
              <button
                onClick={() => setInspectorFilter("all")}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
          {(dateRange?.from || dateRange?.to) && (
            <Badge variant="secondary" className="gap-1">
              Date Range:{" "}
              {dateRange?.from ? format(dateRange.from, "MMM dd") : ""} -{" "}
              {dateRange?.to ? format(dateRange.to, "MMM dd") : ""}
              <button
                onClick={() => setDateRange(undefined)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Inspections Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Inspection ID</TableHead>
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
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading inspections...
                    </TableCell>
                  </TableRow>
                ) : filteredInspections?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No inspections found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInspections?.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell>
                        {formatDate(inspection.inspection_date)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {toShortId(inspection.id, 8)}
                        </span>
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
                              onClick={() => handleDownloadPdf(inspection)}
                            >
                              <FileDown className="mr-2 h-4 w-4" />
                              Download PDF
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

      {/* Results Count and Pagination Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {startIndex + 1}-
            {Math.min(endIndex, filteredInspections?.length || 0)} of{" "}
            {filteredInspections?.length || 0} inspections
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
                      variant={currentPage === pageNum ? "default" : "outline"}
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
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
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
