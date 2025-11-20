import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, AlertTriangle, Check, Crown, X, List, Grid, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DriverFormDialog } from "@/components/driver-form-dialog";
import { DriverDetailsDialog } from "@/components/drivers/driver-details-dialog";
import { DeleteDriverDialog } from "@/components/driver-form/delete-driver-dialog";
import type { Driver } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DriverQuickActions } from "@/components/drivers/DriverQuickActions";
import { safeArrayResult } from "@/lib/utils/type-guards";

export default function Drivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>();
  const [driverForDetails, setDriverForDetails] = useState<Driver | null>(null);
  const [driverForEdit, setDriverForEdit] = useState<Driver | undefined>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vipFilter, setVipFilter] = useState<string>("all");
  const [expiredLicenseFilter, setExpiredLicenseFilter] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const driversPerPage = 20;

  // Fetch drivers data
  const {
    data: drivers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select(
            "id, name, contact, location, license_number, license_type, license_expiry, status, is_vip, avatar_url, document_url, airport_id_url, created_at"
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Drivers query error:", error);
          toast({
            title: "Error fetching drivers",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }

        return safeArrayResult<Driver>(data);
      } catch (err: any) {
        console.error("Drivers query failed:", err);
        // If location column doesn't exist, try without it
        if (err?.message?.includes("location") || err?.code === "42703") {
          console.warn("Location column not found, retrying without it");
          const { data, error: retryError } = await supabase
            .from("drivers")
            .select(
              "id, name, contact, license_number, license_type, license_expiry, status, is_vip, avatar_url, document_url, airport_id_url, created_at"
            )
            .order("created_at", { ascending: false });
          
          if (retryError) {
            toast({
              title: "Error fetching drivers",
              description: retryError.message,
              variant: "destructive",
            });
            throw retryError;
          }
          return safeArrayResult<Driver>(data);
        }
        throw err;
      }
    },
    // Ensure the list feels responsive and stays fresh
    staleTime: 5 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    placeholderData: (previousData) => previousData,
    retry: 1,
  });

  // Fetch trips data for driver trip counts
  const { data: trips } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id, driver_id, status, date")
        .order("date", { ascending: false });

      if (error) throw error;
      return safeArrayResult<any>(data);
    },
    staleTime: 10 * 1000,
    placeholderData: (previousData) => previousData,
  });

  // Calculate driver statistics
  const driverStats = useMemo(() => {
    if (!drivers) return null;

    const total = drivers.length;
    const active = drivers.filter((d) => d.status === "active").length;
    const inactive = drivers.filter((d) => d.status === "inactive").length;
    const onLeave = drivers.filter((d) => d.status === "on_leave").length;

    // Calculate expiring licenses (within 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    const expiringLicenses = drivers.filter((d) => {
      if (!d.license_expiry) return false;
      const expiryDate = new Date(d.license_expiry);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
    }).length;

    // Calculate expired licenses
    const expiredLicenses = drivers.filter((d) => {
      if (!d.license_expiry) return false;
      const expiryDate = new Date(d.license_expiry);
      return expiryDate < now;
    }).length;

    return {
      total,
      active,
      inactive,
      onLeave,
      expiringLicenses,
      expiredLicenses,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
    };
  }, [drivers]);

  // Calculate driver performance metrics
  const driverPerformance = useMemo(() => {
    if (!drivers || !trips) return {};

    const performance: Record<
      string,
      {
        totalTrips: number;
        completedTrips: number;
        onTimeTrips: number;
        completionRate: number;
        onTimeRate: number;
        efficiencyScore: number;
        lastTripDate?: string;
      }
    > = {};

    trips.forEach((trip) => {
      if (trip.driver_id) {
        if (!performance[trip.driver_id]) {
          performance[trip.driver_id] = {
            totalTrips: 0,
            completedTrips: 0,
            onTimeTrips: 0,
            completionRate: 0,
            onTimeRate: 0,
            efficiencyScore: 0,
          };
        }

        performance[trip.driver_id].totalTrips++;

        if (trip.status === "completed") {
          performance[trip.driver_id].completedTrips++;
          // Assume on-time if completed (you can add actual time tracking logic)
          performance[trip.driver_id].onTimeTrips++;
        }

        if (
          !performance[trip.driver_id].lastTripDate ||
          trip.date > performance[trip.driver_id].lastTripDate!
        ) {
          performance[trip.driver_id].lastTripDate = trip.date;
        }
      }
    });

    // Calculate rates and efficiency scores
    Object.keys(performance).forEach((driverId) => {
      const driver = performance[driverId];
      driver.completionRate =
        driver.totalTrips > 0
          ? (driver.completedTrips / driver.totalTrips) * 100
          : 0;
      driver.onTimeRate =
        driver.completedTrips > 0
          ? (driver.onTimeTrips / driver.completedTrips) * 100
          : 0;

      // Efficiency score based on completion rate, on-time rate, and trip frequency
      const completionWeight = 0.4;
      const onTimeWeight = 0.3;
      const frequencyWeight = 0.3;

      const completionScore = driver.completionRate;
      const onTimeScore = driver.onTimeRate;
      const frequencyScore = Math.min(driver.totalTrips * 10, 100); // Cap at 100

      driver.efficiencyScore =
        completionScore * completionWeight +
        onTimeScore * onTimeWeight +
        frequencyScore * frequencyWeight;
    });

    return performance;
  }, [drivers, trips]);

  // Calculate driver trip counts (simplified)
  const driverTripCounts = useMemo(() => {
    if (!drivers || !trips) return {};

    const counts: Record<string, { totalTrips: number }> = {};

    trips.forEach((trip) => {
      if (trip.driver_id) {
        if (!counts[trip.driver_id]) {
          counts[trip.driver_id] = { totalTrips: 0 };
        }
        counts[trip.driver_id].totalTrips++;
      }
    });

    return counts;
  }, [drivers, trips]);

  const handleDriverDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
    setSelectedDriver(undefined);
    setDriverToDelete(undefined);
    setShowDeleteDialog(false);
  };

  // Quick action handlers
  const handleExportDrivers = async () => {
    if (!drivers) return;

    try {
      const csvContent = [
        [
          "Name",
          "Contact",
          "License Number",
          "License Type",
          "License Expiry",
          "Status",
          "VIP Driver",
        ],
        ...drivers.map((driver) => [
          driver.name,
          driver.contact,
          driver.license_number,
          driver.license_type,
          driver.license_expiry,
          driver.status,
          driver.is_vip ? "Yes" : "No",
        ]),
      ]
        .map((row, index) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drivers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Driver data has been exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export driver data",
        variant: "destructive",
      });
    }
  };

  const handleImportDrivers = async () => {
    toast({
      title: "Import feature",
      description: "Import functionality will be available in the next update",
    });
  };

  const handleSendBulkMessage = async () => {
    toast({
      title: "Bulk messaging",
      description:
        "Bulk messaging feature will be available in the next update",
    });
  };

  const handleGenerateReport = async () => {
    toast({
      title: "Report generation",
      description:
        "Report generation feature will be available in the next update",
    });
  };

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel("drivers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["drivers"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDriverClick = (driver: Driver) => {
    setDriverForDetails(driver);
  };

  const handleEditFromDetails = () => {
    if (driverForDetails) {
      setDriverForEdit(driverForDetails);
      setDriverForDetails(null);
    }
  };

  const handleDeleteFromDetails = () => {
    if (driverForDetails) {
      setDriverToDelete(driverForDetails);
      setDriverForDetails(null);
      setShowDeleteDialog(true);
    }
  };

  // Check if license is expired
  const isLicenseExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    return expiry < now;
  };

  // Check if license is expiring soon
  const isLicenseExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    const expiry = new Date(expiryDate);
    return expiry <= thirtyDaysFromNow && expiry >= now;
  };

  // Filter drivers based on search and filters
  const filteredDrivers = useMemo(() => {
    if (!drivers) return [];

    let filtered = drivers.filter((driver) => {
      const matchesSearch =
        !searchTerm ||
        driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || driver.status === statusFilter;

      const matchesVip =
        vipFilter === "all" ||
        (vipFilter === "vip" && driver.is_vip) ||
        (vipFilter === "non-vip" && !driver.is_vip);

      const matchesExpiredLicense =
        !expiredLicenseFilter || isLicenseExpired(driver.license_expiry || "");

      return matchesSearch && matchesStatus && matchesVip && matchesExpiredLicense;
    });

    // Sort alphabetically by name if sort order is set
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        if (sortOrder === "asc") {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
    }

    return filtered;
  }, [drivers, searchTerm, statusFilter, vipFilter, expiredLicenseFilter, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDrivers.length / driversPerPage);
  const startIndex = (currentPage - 1) * driversPerPage;
  const endIndex = startIndex + driversPerPage;
  const paginatedDrivers = filteredDrivers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, vipFilter, expiredLicenseFilter, sortOrder]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 px-6 space-y-6">
          <div className="border-b border-border pb-4 pt-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Error</h1>
              <p className="text-destructive text-sm mt-1">
                Failed to load drivers
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-3 sm:p-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                Drivers
              </h1>
            </div>
            <Button
              onClick={() => setIsAddingDriver(true)}
              variant="outline"
              size="sm"
              className="text-foreground border-border/50 w-full sm:w-auto"
            >
              Add Driver
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Section */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search drivers by name, license, contact, or location..."
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-11 border-border/50 focus:border-primary/50">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={vipFilter} onValueChange={setVipFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] h-11 border-border/50 focus:border-primary/50">
                    <Crown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="VIP" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drivers</SelectItem>
                    <SelectItem value="vip">VIP Only</SelectItem>
                    <SelectItem value="non-vip">Non-VIP</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={expiredLicenseFilter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpiredLicenseFilter(!expiredLicenseFilter)}
                  className="h-11 border-border/50"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Expired License
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (sortOrder === null) {
                      setSortOrder("asc");
                    } else if (sortOrder === "asc") {
                      setSortOrder("desc");
                    } else {
                      setSortOrder(null);
                    }
                  }}
                  className="h-11 border-border/50"
                >
                  {sortOrder === null && <ArrowUpDown className="mr-2 h-4 w-4" />}
                  {sortOrder === "asc" && <ArrowUp className="mr-2 h-4 w-4" />}
                  {sortOrder === "desc" && <ArrowDown className="mr-2 h-4 w-4" />}
                  <span className="hidden sm:inline">
                    {sortOrder === null
                      ? "Sort Name"
                      : sortOrder === "asc"
                      ? "A-Z"
                      : "Z-A"}
                  </span>
                </Button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 sm:px-3 rounded-md transition-all ${
                    viewMode === "list"
                      ? "bg-background text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <List className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">List</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 sm:px-3 rounded-md transition-all ${
                    viewMode === "grid"
                      ? "bg-background text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Grid</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== "all" || vipFilter !== "all" || expiredLicenseFilter || sortOrder) && (
            <div className="flex items-center justify-between">
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
                {vipFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {vipFilter === "vip" ? "VIP Only" : "Non-VIP"}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setVipFilter("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {expiredLicenseFilter && (
                  <Badge variant="secondary" className="gap-1">
                    Expired License
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setExpiredLicenseFilter(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {sortOrder && (
                  <Badge variant="secondary" className="gap-1">
                    Sort: {sortOrder === "asc" ? "A-Z" : "Z-A"}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSortOrder(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setVipFilter("all");
                  setExpiredLicenseFilter(false);
                  setSortOrder(null);
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Drivers Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedDrivers.map((driver) => {
              const tripCount = driverTripCounts[driver.id];
              const isExpiring = isLicenseExpiringSoon(driver.license_expiry);
              const isExpired = isLicenseExpired(driver.license_expiry);

              return (
                <Card
                  key={driver.id}
                  className="relative cursor-pointer hover:bg-muted/20 transition-all duration-200 overflow-hidden"
                  onClick={() => handleDriverClick(driver)}
                >
                  <CardContent className="p-5">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14">
                          <AvatarImage
                            src={driver.avatar_url}
                            alt={driver.name}
                          />
                          <AvatarFallback className="text-base font-semibold bg-muted/50">
                            {driver.name
                              .split(" ")
                              .map((n, index) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg text-foreground truncate">
                            {driver.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {driver.contact}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {driver.is_vip && (
                          <Badge
                            className="bg-purple-500/20 text-purple-600 border-purple-500/30"
                            variant="outline"
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            VIP Driver
                          </Badge>
                        )}
                        <Badge
                          className={
                            driver.status === "active"
                              ? "bg-green-500/20 text-green-600 border-green-500/30"
                              : driver.status === "inactive"
                              ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                              : driver.status === "on_leave"
                              ? "bg-gray-500/20 text-gray-600 border-gray-500/30"
                              : "bg-gray-500/20 text-gray-600 border-gray-500/30"
                          }
                          variant="outline"
                        >
                          {driver.status === "active" && (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {driver.status === "inactive" && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {driver.status?.replace("_", " ") || "Unknown"}
                        </Badge>
                      </div>
                    </div>

                    {/* License Details Section */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">
                          License:
                        </span>
                        <span className="font-semibold text-foreground">
                          {driver.license_number || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">
                          Type:
                        </span>
                        <span className="text-foreground">
                          {driver.license_type || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">
                          Expiry:
                        </span>
                        <span
                          className={
                            isExpired
                              ? "text-red-500 font-semibold"
                              : isExpiring
                              ? "text-orange-500 font-semibold"
                              : "text-foreground font-medium"
                          }
                        >
                          {driver.license_expiry
                            ? new Date(
                                driver.license_expiry
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>

                      {/* License Warning */}
                      {(isExpired || isExpiring) && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                            <AlertTriangle className="h-4 w-4" />
                            <span>
                              {isExpired
                                ? "License expired"
                                : "License expiring soon"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>VIP Driver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDrivers.map((driver) => {
                  const tripCount = driverTripCounts[driver.id];
                  const isExpiring = isLicenseExpiringSoon(
                    driver.license_expiry
                  );
                  const isExpired = isLicenseExpired(driver.license_expiry);

                  return (
                    <TableRow
                      key={driver.id}
                      className="cursor-pointer hover:bg-muted/50 transition-all duration-200"
                      onClick={() => handleDriverClick(driver)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={driver.avatar_url}
                              alt={driver.name}
                            />
                            <AvatarFallback className="text-sm font-semibold bg-muted/50">
                              {driver.name
                                .split(" ")
                                .map((n, index) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">
                              {driver.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{driver.contact}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {driver.location || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {driver.license_number || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isExpired
                                ? "text-red-500 font-semibold"
                                : isExpiring
                                ? "text-orange-500 font-semibold"
                                : "text-foreground"
                            }
                          >
                            {driver.license_expiry
                              ? new Date(
                                  driver.license_expiry
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                          {(isExpired || isExpiring) && (
                            <Badge
                              variant="destructive"
                              className="bg-red-500/20 text-red-600 border-red-500/30 text-xs"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {isExpired ? "Expired" : "Expiring"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            driver.status === "active"
                              ? "bg-green-500/20 text-green-600 border-green-500/30"
                              : driver.status === "inactive"
                              ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
                              : driver.status === "on_leave"
                              ? "bg-gray-500/20 text-gray-600 border-gray-500/30"
                              : "bg-gray-500/20 text-gray-600 border-gray-500/30"
                          }
                          variant="outline"
                        >
                          {driver.status === "active" && (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {driver.status === "inactive" && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {driver.status?.replace("_", " ") || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {driver.is_vip ? (
                          <Badge
                            className="bg-purple-500/20 text-purple-600 border-purple-500/30"
                            variant="outline"
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            VIP Driver
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Results Count and Pagination Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredDrivers.length)} of{" "}
              {filteredDrivers.length} drivers
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

        <DriverDetailsDialog
          isOpen={!!driverForDetails}
          onOpenChange={(open) => {
            if (!open) setDriverForDetails(null);
          }}
          driver={driverForDetails}
          onEdit={handleEditFromDetails}
          onDelete={handleDeleteFromDetails}
        />

        <DriverFormDialog
          open={isAddingDriver || !!driverForEdit || !!selectedDriver}
          onOpenChange={(open) => {
            setIsAddingDriver(open);
            if (!open) {
              setDriverForEdit(undefined);
              setSelectedDriver(undefined);
            }
          }}
          driver={driverForEdit || selectedDriver}
          onDriverDeleted={handleDriverDeleted}
        />

        <DeleteDriverDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          driver={driverToDelete}
          onDelete={handleDriverDeleted}
        />
      </div>
    </div>
  );
}
