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
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  CreditCard,
  CalendarDays,
  TrendingUp,
  Users,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isValid, differenceInDays, addDays } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { LeaseForm } from "@/components/leasing/LeaseForm";
import { LeaseDetailsDialog } from "@/components/leasing/LeaseDetailsDialog";

interface VehicleLease {
  id: string;
  vehicle_id: string;
  contract_id: string;
  lessee_name: string;
  lessee_email: string;
  lessee_phone: string;
  lessee_address: string;
  lease_start_date: string;
  lease_end_date: string;
  daily_rate: number;
  lease_status: "active" | "pending" | "expired" | "terminated" | "upcoming";
  payment_status: "current" | "overdue" | "partial" | "paid_ahead";
  notes?: string;
  insurance_required: boolean;
  maintenance_included: boolean;
  driver_included: boolean;
  fuel_included: boolean;
  assigned_driver_id?: string;
  created_at: string;
  updated_at: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    registration: string;
    vin: string;
  };
  assigned_driver?: {
    name: string;
    phone: string;
  };
}

export default function VehicleLeasing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<VehicleLease | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>();

  // Fetch vehicle leases
  const { data: leases, isLoading } = useQuery({
    queryKey: ["vehicle-leases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_leases")
        .select(
          `
          *,
          vehicle:vehicles (
            make,
            model,
            year,
            registration,
            vin
          ),
          assigned_driver:drivers (
            name,
            phone
          )
        `
        )
        .order("lease_start_date", { ascending: false });

      if (error) throw error;
      return data as VehicleLease[];
    },
  });

  // Fetch vehicles for filter dropdown
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-leasing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration")
        .order("make");
      if (error) throw error;
      return data;
    },
  });

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!leases)
      return {
        total: 0,
        active: 0,
        expiringSoon: 0,
        monthlyRevenue: 0,
        overdue: 0,
      };

    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    return {
      total: leases.length,
      active: leases.filter((lease) => lease.lease_status === "active").length,
      expiringSoon: leases.filter((lease) => {
        const endDate = parseISO(lease.lease_end_date);
        return (
          isValid(endDate) && endDate <= thirtyDaysFromNow && endDate >= now
        );
      }).length,
      monthlyRevenue: leases
        .filter((lease) => lease.lease_status === "active")
        .reduce((sum, lease) => sum + lease.daily_rate * 30, 0), // Approximate monthly revenue
      overdue: leases.filter((lease) => lease.payment_status === "overdue")
        .length,
    };
  }, [leases]);

  // Filter leases
  const filteredLeases = useMemo(() => {
    if (!leases) return [];

    return leases.filter((lease) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleName = lease.vehicle
          ? `${lease.vehicle.make} ${lease.vehicle.model}`.toLowerCase()
          : "";
        const registration = lease.vehicle?.registration?.toLowerCase() || "";
        const lesseeName = lease.lessee_name.toLowerCase();

        if (
          !vehicleName.includes(searchLower) &&
          !registration.includes(searchLower) &&
          !lesseeName.includes(searchLower)
        ) {
          return false;
        }
      }

      // Vehicle filter
      if (vehicleFilter !== "all" && lease.vehicle_id !== vehicleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && lease.lease_status !== statusFilter) {
        return false;
      }

      // Payment status filter
      if (
        paymentStatusFilter !== "all" &&
        lease.payment_status !== paymentStatusFilter
      ) {
        return false;
      }

      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const leaseStart = parseISO(lease.lease_start_date);
        if (dateRange.from && leaseStart < dateRange.from) return false;
        if (dateRange.to && leaseStart > dateRange.to) return false;
      }

      return true;
    });
  }, [
    leases,
    searchTerm,
    vehicleFilter,
    statusFilter,
    paymentStatusFilter,
    dateRange,
  ]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vehicle_leases")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-leases"] });
      toast({
        title: "Lease deleted",
        description: "The vehicle lease has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting lease:", error);
      toast({
        title: "Error",
        description: "Failed to delete lease. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleViewDetails = (lease: VehicleLease) => {
    setSelectedLease(lease);
    setDetailsOpen(true);
  };

  const handleEditLease = (lease: VehicleLease) => {
    setSelectedLease(lease);
    setFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        label: "Active",
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600",
      },
      pending: {
        label: "Pending",
        variant: "secondary" as const,
        icon: Clock,
        color: "text-yellow-600",
      },
      expired: {
        label: "Expired",
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-red-600",
      },
      terminated: {
        label: "Terminated",
        variant: "outline" as const,
        icon: XCircle,
        color: "text-gray-600",
      },
      upcoming: {
        label: "Upcoming",
        variant: "secondary" as const,
        icon: Calendar,
        color: "text-blue-600",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      current: {
        label: "Current",
        variant: "default" as const,
        color: "bg-green-100 text-green-800",
      },
      overdue: {
        label: "Overdue",
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800",
      },
      partial: {
        label: "Partial",
        variant: "secondary" as const,
        color: "bg-yellow-100 text-yellow-800",
      },
      paid_ahead: {
        label: "Paid Ahead",
        variant: "outline" as const,
        color: "bg-blue-100 text-blue-800",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.current;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid Date";
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = parseISO(endDate);
    if (!isValid(end)) return null;
    return differenceInDays(end, new Date());
  };

  const clearFilters = () => {
    setSearchTerm("");
    setVehicleFilter("all");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setDateRange(undefined);
  };

  const exportToCSV = () => {
    if (!filteredLeases || filteredLeases.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no leases to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Contract ID",
      "Vehicle",
      "Registration",
      "Lessee",
      "Email",
      "Phone",
      "Start Date",
      "End Date",
      "Daily Rate",
      "Monthly Estimate",
      "Status",
      "Payment Status",
    ];

    const csvData = filteredLeases.map((lease) => [
      lease.contract_id || "N/A",
      lease.vehicle
        ? `${lease.vehicle.make} ${lease.vehicle.model} (${lease.vehicle.year})`
        : "Unknown",
      lease.vehicle?.registration || "",
      lease.lessee_name,
      lease.lessee_email,
      lease.lessee_phone,
      formatDate(lease.lease_start_date),
      formatDate(lease.lease_end_date),
      (lease.daily_rate || 0).toString(),
      ((lease.daily_rate || 0) * 30).toString(),
      lease.lease_status,
      lease.payment_status,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vehicle-leases-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${filteredLeases.length} vehicle leases to CSV.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Vehicle Leasing
          </h2>
          <p className="text-muted-foreground">
            Manage vehicle leases, contracts, and customer relationships
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedLease(null);
            setFormOpen(true);
          }}
          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-5 w-5" />
          New Lease Agreement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leases</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summaryStats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              All lease agreements
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryStats.active}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summaryStats.expiringSoon}
            </div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${summaryStats.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From active leases</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryStats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">Payment overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle, lessee name, or email..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={paymentStatusFilter}
              onValueChange={setPaymentStatusFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid_ahead">Paid Ahead</SelectItem>
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
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leases Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Contract & Vehicle</TableHead>
                  <TableHead>Lessee</TableHead>
                  <TableHead>Lease Period</TableHead>
                  <TableHead>Financial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading vehicle leases...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLeases?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Car className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No vehicle leases found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeases?.map((lease) => {
                    const daysUntilExpiry = getDaysUntilExpiry(
                      lease.lease_end_date
                    );
                    const isExpiringSoon =
                      daysUntilExpiry !== null &&
                      daysUntilExpiry <= 30 &&
                      daysUntilExpiry >= 0;

                    return (
                      <TableRow key={lease.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-blue-600">
                              Contract #{lease.contract_id || "N/A"}
                            </div>
                            <div className="text-sm">
                              {lease.vehicle
                                ? `${lease.vehicle.make} ${lease.vehicle.model} (${lease.vehicle.year})`
                                : "Unknown Vehicle"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {lease.vehicle?.registration}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {lease.lessee_name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lease.lessee_email}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lease.lessee_phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">Start:</span>{" "}
                              {formatDate(lease.lease_start_date)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">End:</span>{" "}
                              {formatDate(lease.lease_end_date)}
                            </div>
                            {isExpiringSoon && (
                              <div className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Expires in {daysUntilExpiry} days
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-green-600">
                              ${lease.daily_rate?.toLocaleString() || "0"}/day
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Monthly: $
                              {((lease.daily_rate || 0) * 30).toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {getStatusBadge(lease.lease_status)}
                            {getPaymentStatusBadge(lease.payment_status)}
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
                                onClick={() => handleViewDetails(lease)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditLease(lease)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Lease
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(lease.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
              {selectedLease ? "Edit Lease Agreement" : "New Lease Agreement"}
            </DialogTitle>
            <DialogDescription>
              {selectedLease
                ? "Update the lease agreement details and terms."
                : "Create a new vehicle lease agreement with customer details and terms."}
            </DialogDescription>
          </DialogHeader>
          <LeaseForm
            lease={selectedLease}
            onSuccess={() => {
              setFormOpen(false);
              setSelectedLease(null);
              queryClient.invalidateQueries({
                queryKey: ["vehicle-leases"],
              });
            }}
            onCancel={() => {
              setFormOpen(false);
              setSelectedLease(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <LeaseDetailsDialog
        lease={selectedLease}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
