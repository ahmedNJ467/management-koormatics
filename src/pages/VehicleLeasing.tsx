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
  contract?: {
    contract_number: string | null;
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
          ),
          contract:contracts (
            contract_number
          )
        `
        )
        .order("lease_start_date", { ascending: false });

      if (error) throw error;
      return data as any;
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
      active: leases.filter((lease: any) => lease.lease_status === "active").length,
      expiringSoon: leases.filter((lease: any) => {
        const endDate = parseISO(lease.lease_end_date);
        return (
          isValid(endDate) && endDate <= thirtyDaysFromNow && endDate >= now
        );
      }).length,
      monthlyRevenue: leases
        .filter((lease: any) => lease.lease_status === "active")
        .reduce((sum: any, lease: any) => sum + lease.daily_rate * 30, 0), // Approximate monthly revenue
      overdue: leases.filter((lease: any) => lease.payment_status === "overdue")
        .length,
    };
  }, [leases]);

  // Filter leases
  const filteredLeases = useMemo(() => {
    if (!leases) return [];

    return leases.filter((lease: any) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleName = lease.vehicle
          ? `${lease.vehicle.make} ${lease.vehicle.model}`.toLowerCase()
          : "";
        const registration = lease.vehicle?.registration?.toLowerCase() || "";
        const lesseeName = lease.lessee_name.toLowerCase();
        const contractNumber = (
          lease.contract?.contract_number || ""
        ).toLowerCase();

        if (
          !vehicleName.includes(searchLower) &&
          !registration.includes(searchLower) &&
          !lesseeName.includes(searchLower) &&
          !contractNumber.includes(searchLower)
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
        .eq("id", id as any);
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
        color: "text-green-600 dark:text-green-400",
      },
      pending: {
        label: "Pending",
        variant: "secondary" as const,
        icon: Clock,
        color: "text-yellow-600 dark:text-yellow-400",
      },
      expired: {
        label: "Expired",
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
      },
      terminated: {
        label: "Terminated",
        variant: "outline" as const,
        icon: XCircle,
        color: "text-muted-foreground",
      },
      upcoming: {
        label: "Upcoming",
        variant: "secondary" as const,
        icon: Calendar,
        color: "text-blue-600 dark:text-blue-400",
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
        color:
          "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
      },
      overdue: {
        label: "Overdue",
        variant: "destructive" as const,
        color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
      },
      partial: {
        label: "Partial",
        variant: "secondary" as const,
        color:
          "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400",
      },
      paid_ahead: {
        label: "Paid Ahead",
        variant: "outline" as const,
        color:
          "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400",
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

    const csvData = filteredLeases.map((lease: any) => [
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
      .map((row) => row.map((cell: any) => `"${cell}"`).join(","))
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Vehicle Leasing
              </h1>
            </div>
            <Button
              onClick={() => {
                setSelectedLease(null);
                setFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              New Lease Agreement
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Leases
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {summaryStats.total}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All lease agreements
                </p>
              </div>
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-50 dark:bg-blue-900/10"></div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Leases
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {summaryStats.active}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently active
                </p>
              </div>
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-green-50 dark:bg-green-900/10"></div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expiring Soon
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {summaryStats.expiringSoon}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Within 30 days
                </p>
              </div>
              <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-3">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-orange-50 dark:bg-orange-900/10"></div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Monthly Revenue
                </p>
                <p className="text-3xl font-bold text-foreground">
                  ${summaryStats.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From active leases
                </p>
              </div>
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-3">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-50 dark:bg-purple-900/10"></div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overdue
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {summaryStats.overdue}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment overdue
                </p>
              </div>
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-red-50 dark:bg-red-900/10"></div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
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
                  <SelectItem key={(vehicle as any).id} value={(vehicle as any).id}>
                    {(vehicle as any).make} {(vehicle as any).model} ({(vehicle as any).registration})
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
        </div>

        {/* Leases Table */}
        <div className="bg-card rounded-2xl shadow-sm border border-border">
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
                  filteredLeases?.map((lease: any) => {
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
                            <div className="font-medium text-blue-600 dark:text-blue-400">
                              Contract{" "}
                              {lease.contract?.contract_number ||
                                "#" + (lease.contract_id?.slice(0, 8) || "N/A")}
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
                              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Expires in {daysUntilExpiry} days
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
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
                                className="text-destructive"
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
        </div>

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
    </div>
  );
}
