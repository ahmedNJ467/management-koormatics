import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { generateInvoiceForLease } from "@/lib/lease-invoice-generator";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  daily_rate: number | null;
  monthly_rate: number;
  contract_number: string;
  early_termination_fee: number;
  lease_status:
    | "active"
    | "pending"
    | "expired"
    | "terminated"
    | "upcoming"
    | string
    | null;
  payment_status:
    | "draft"
    | "sent"
    | "paid"
    | "overdue"
    | "cancelled"
    | string
    | null;
  notes?: string;
  insurance_required: boolean;
  maintenance_included: boolean;
  driver_included: boolean;
  fuel_included: boolean;
  assigned_driver_id?: string;
  client_id: string;
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
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch vehicle leases
  const { data: leases, isLoading } = useQuery({
    queryKey: ["vehicle-leases"],
    queryFn: async () => {
      // 1) Load leases without relationship expansion to avoid PostgREST 400s
      const { data: leaseRows, error: leasesError } = await supabase
        .from("vehicle_leases")
        .select("*")
        .order("lease_start_date", { ascending: false });

      if (leasesError) {
        console.error("Error fetching vehicle leases (base):", {
          message: (leasesError as any)?.message,
          details: (leasesError as any)?.details,
          hint: (leasesError as any)?.hint,
          code: (leasesError as any)?.code,
        });
        throw leasesError;
      }

      const rows = leaseRows || [];
      if (rows.length === 0) return [] as any;

      // 2) Collect related IDs
      const vehicleIds = Array.from(
        new Set(
          rows
            .map((r: any) => r.vehicle_id)
            .filter((v: string | null) => Boolean(v))
        )
      );
      const driverIds = Array.from(
        new Set(
          rows
            .map((r: any) => r.assigned_driver_id)
            .filter((v: string | null) => Boolean(v))
        )
      );
      const contractIds = Array.from(
        new Set(
          rows
            .map((r: any) => r.contract_id)
            .filter((v: string | null) => Boolean(v))
        )
      );

      // 3) Batch load related entities
      const [vehiclesRes, driversRes, contractsRes] = await Promise.all([
        vehicleIds.length
          ? supabase
              .from("vehicles")
              .select("id, make, model, year, registration, vin")
              .in("id", vehicleIds)
          : Promise.resolve({ data: [], error: null } as any),
        driverIds.length
          ? supabase
              .from("drivers")
              .select("id, name, phone")
              .in("id", driverIds)
          : Promise.resolve({ data: [], error: null } as any),
        contractIds.length
          ? supabase
              .from("contracts")
              .select("id, contract_number")
              .in("id", contractIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const { data: vehiclesData, error: vehiclesError } = vehiclesRes as any;
      const { data: driversData, error: driversError } = driversRes as any;
      const { data: contractsData, error: contractsError } =
        contractsRes as any;

      if (vehiclesError || driversError || contractsError) {
        console.error("Error fetching related lease entities:", {
          vehiclesError,
          driversError,
          contractsError,
        });
        throw vehiclesError || driversError || contractsError;
      }

      const vehicleById = new Map(
        (vehiclesData || []).map((v: any) => [v.id, v])
      );
      const driverById = new Map(
        (driversData || []).map((d: any) => [d.id, d])
      );
      const contractById = new Map(
        (contractsData || []).map((c: any) => [c.id, c])
      );

      // 4) Merge into enriched lease objects
      const enriched = rows.map((r: any) => ({
        ...r,
        vehicle: r.vehicle_id ? vehicleById.get(r.vehicle_id) || null : null,
        assigned_driver: r.assigned_driver_id
          ? driverById.get(r.assigned_driver_id) || null
          : null,
        contract: r.contract_id
          ? contractById.get(r.contract_id) || null
          : null,
      }));

      // Deduplicate leases by ID to prevent React key conflicts
      const uniqueLeases = enriched.filter(
        (lease: any, index: number, self: any[]) =>
          index === self.findIndex((l) => l.id === lease.id)
      );

      return uniqueLeases as any;
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
      active: leases.filter((lease: any) => lease.lease_status === "active")
        .length,
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

      // Status filter
      if (statusFilter !== "all" && lease.lease_status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [
    leases,
    searchTerm,
    statusFilter,
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

  const handleGenerateInvoice = async (lease: VehicleLease) => {
    try {
      // Generate invoice for current month
      const currentDate = new Date();
      const billingPeriodStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const billingPeriodEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      await generateInvoiceForLease(
        lease,
        billingPeriodStart,
        billingPeriodEnd
      );

      toast({
        title: "Invoice Generated",
        description: `Invoice generated successfully for lease ${lease.contract_number}`,
      });

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ["vehicle-leases"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (error) {
      toast({
        title: "Failed to Generate Invoice",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
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
      draft: {
        label: "Draft",
        variant: "secondary" as const,
        color:
          "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400",
      },
      sent: {
        label: "Sent",
        variant: "default" as const,
        color:
          "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400",
      },
      paid: {
        label: "Paid",
        variant: "default" as const,
        color:
          "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
      },
      overdue: {
        label: "Overdue",
        variant: "destructive" as const,
        color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
      },
      cancelled: {
        label: "Cancelled",
        variant: "outline" as const,
        color:
          "bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-500",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

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
    setStatusFilter("all");
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
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
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
        {/* Header removed in favor of standardized header above */}

        {/* Summary Cards - match Quotations */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">
                Total Leases
              </CardTitle>
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold">{summaryStats.total}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                All lease agreements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">
                Active Leases
              </CardTitle>
              <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold">{summaryStats.active}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold">
                {summaryStats.expiringSoon}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Within 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold">
                ${summaryStats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                From active leases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold">{summaryStats.overdue}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Payment overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle, lessee name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
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

        {/* Leases Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>
                  {filteredLeases.length} of {summaryStats.total} leases
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                  {filteredLeases?.length === 0 ? (
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
                                  "#" +
                                    (lease.contract_id?.slice(0, 8) || "N/A")}
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
                                ${lease.daily_rate?.toLocaleString() || "0"}
                                /day
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Monthly: $
                                {(
                                  (lease.daily_rate || 0) * 30
                                ).toLocaleString()}
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
                                <DropdownMenuItem
                                  onClick={() => handleGenerateInvoice(lease)}
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Generate Invoice
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
    </div>
  );
}
