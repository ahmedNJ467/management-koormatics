import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Users,
  Car,
  TrendingUp,
  Clock,
  List,
  Grid,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DriverFormDialog } from "@/components/driver-form-dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DriverAnalytics } from "@/components/drivers/DriverAnalytics";
import { DriverQuickActions } from "@/components/drivers/DriverQuickActions";

export default function Drivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("drivers");

  // Fetch drivers data
  const {
    data: drivers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error fetching drivers",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as Driver[];
    },
  });

  // Fetch trips data for driver performance
  const { data: trips } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(
          "id, driver_id, amount, status, date, pickup_location, dropoff_location"
        )
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
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

  const handleDriverDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
    setSelectedDriver(undefined);
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
        ],
        ...drivers.map((driver) => [
          driver.name,
          driver.contact,
          driver.license_number,
          driver.license_type,
          driver.license_expiry,
          driver.status,
        ]),
      ]
        .map((row) => row.join(","))
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
    setSelectedDriver(driver);
  };

  // Filter drivers based on search and filters
  const filteredDrivers = useMemo(() => {
    if (!drivers) return [];

    return drivers.filter((driver) => {
      const matchesSearch =
        !searchTerm ||
        driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || driver.status === statusFilter;

      const matchesLicenseType =
        licenseTypeFilter === "all" ||
        driver.license_type === licenseTypeFilter;

      return matchesSearch && matchesStatus && matchesLicenseType;
    });
  }, [drivers, searchTerm, statusFilter, licenseTypeFilter]);

  // Get unique license types for filter
  const licenseTypes = useMemo(() => {
    if (!drivers) return [];
    return Array.from(new Set(drivers.map((d) => d.license_type))).sort();
  }, [drivers]);

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

  // Check if license is expired
  const isLicenseExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    return expiry < now;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Drivers</h2>
            <p className="text-muted-foreground">Loading drivers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Error</h2>
          <p className="text-destructive">Failed to load drivers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Drivers</h2>
          <p className="text-muted-foreground">
            Manage your fleet drivers and track performance
          </p>
        </div>
        <Button
          onClick={() => setIsAddingDriver(true)}
          variant="outline"
          size="lg"
          className="gap-2 text-white border-white/20"
        >
          <Plus className="h-5 w-5" /> Add Driver
        </Button>
      </div>

      {/* Summary Cards */}
      {driverStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Drivers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driverStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {driverStats.active} active, {driverStats.onLeave} on leave
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Drivers
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{driverStats.active}</div>
              <div className="flex items-center space-x-2">
                <Progress
                  value={driverStats.activePercentage}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground">
                  {driverStats.activePercentage}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring Licenses
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {driverStats.expiringLicenses}
              </div>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expired Licenses
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {driverStats.expiredLicenses}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Drivers List
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search drivers by name, license, or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={licenseTypeFilter}
                    onValueChange={setLicenseTypeFilter}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="License Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {licenseTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setViewMode(viewMode === "grid" ? "list" : "grid")
                    }
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredDrivers.length} of {drivers?.length || 0} drivers
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-xl p-3 bg-transparent ${
                  viewMode === "list"
                    ? "border-2 border-white/30"
                    : "border-2 border-transparent"
                }`}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List className="h-6 w-6 text-white" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-xl p-3 bg-transparent ${
                  viewMode === "grid"
                    ? "border-2 border-white/30"
                    : "border-2 border-transparent"
                }`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <Grid className="h-6 w-6 text-white" />
              </Button>
            </div>
          </div>

          {/* Drivers Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredDrivers.map((driver) => {
                const performance = driverPerformance[driver.id];
                const isExpiring = isLicenseExpiringSoon(driver.license_expiry);
                const isExpired = isLicenseExpired(driver.license_expiry);

                return (
                  <Card
                    key={driver.id}
                    className="relative cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
                    style={{
                      borderLeftColor: isExpired
                        ? "#ef4444"
                        : isExpiring
                        ? "#f97316"
                        : driver.status === "active"
                        ? "#10b981"
                        : driver.status === "on_leave"
                        ? "#f59e0b"
                        : "#6b7280",
                    }}
                    onClick={() => handleDriverClick(driver)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={driver.avatar_url}
                              alt={driver.name}
                            />
                            <AvatarFallback className="text-sm font-semibold">
                              {driver.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {driver.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {driver.contact}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            driver.status === "active"
                              ? "bg-[#D1FADF] text-[#039855] gap-1 px-3"
                              : driver.status === "inactive"
                              ? "bg-[#FEF0C7] text-[#B54708] gap-1 px-3"
                              : driver.status === "on_leave"
                              ? "bg-[#6B7280] text-white gap-1 px-3"
                              : ""
                          }
                          variant="outline"
                        >
                          {driver.status === "active" && (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          {driver.status === "inactive" && (
                            <AlertTriangle className="h-4 w-4 mr-1" />
                          )}
                          {driver.status?.replace("_", " ") || "Unknown"}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            License:
                          </span>
                          <span className="font-medium">
                            {driver.license_number || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{driver.license_type || "N/A"}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Expiry:</span>
                          <span
                            className={
                              isExpired
                                ? "text-red-600 font-medium"
                                : isExpiring
                                ? "text-orange-600 font-medium"
                                : ""
                            }
                          >
                            {driver.license_expiry
                              ? new Date(
                                  driver.license_expiry
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>

                        {performance && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Total Trips:
                                </span>
                                <span className="font-medium">
                                  {performance.totalTrips}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Completion Rate:
                                </span>
                                <span className="font-medium">
                                  {performance.completionRate.toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  On-Time Rate:
                                </span>
                                <span className="font-medium">
                                  {performance.onTimeRate.toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Efficiency Score:
                                </span>
                                <span className="font-medium">
                                  {performance.efficiencyScore.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </>
                        )}

                        {(isExpired || isExpiring) && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2 text-red-700 text-sm">
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
            <div className="space-y-4">
              {filteredDrivers.map((driver) => {
                const performance = driverPerformance[driver.id];
                const isExpiring = isLicenseExpiringSoon(driver.license_expiry);
                const isExpired = isLicenseExpired(driver.license_expiry);

                return (
                  <Card
                    key={driver.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleDriverClick(driver)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={driver.avatar_url}
                              alt={driver.name}
                            />
                            <AvatarFallback className="text-sm">
                              {driver.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{driver.name}</h3>
                              <Badge
                                className={
                                  driver.status === "active"
                                    ? "bg-[#D1FADF] text-[#039855] gap-1 px-3"
                                    : driver.status === "inactive"
                                    ? "bg-[#FEF0C7] text-[#B54708] gap-1 px-3"
                                    : driver.status === "on_leave"
                                    ? "bg-[#6B7280] text-white gap-1 px-3"
                                    : ""
                                }
                                variant="outline"
                              >
                                {driver.status === "active" && (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                {driver.status === "inactive" && (
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                )}
                                {driver.status?.replace("_", " ") || "Unknown"}
                              </Badge>
                              {(isExpired || isExpiring) && (
                                <Badge
                                  className={
                                    driver.status === "active"
                                      ? "bg-[#D1FADF] text-[#039855] gap-1 px-3"
                                      : driver.status === "inactive"
                                      ? "bg-[#FEF0C7] text-[#B54708] gap-1 px-3"
                                      : driver.status === "on_leave"
                                      ? "bg-[#6B7280] text-white gap-1 px-3"
                                      : ""
                                  }
                                  variant="outline"
                                >
                                  {driver.status === "active" && (
                                    <Check className="h-4 w-4 mr-1" />
                                  )}
                                  {driver.status === "inactive" && (
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                  )}
                                  {driver.status?.replace("_", " ") ||
                                    "Unknown"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {driver.contact}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <div className="text-muted-foreground">License</div>
                            <div className="font-medium">
                              {driver.license_number || "N/A"}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-muted-foreground">Type</div>
                            <div>{driver.license_type || "N/A"}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-muted-foreground">Expiry</div>
                            <div
                              className={
                                isExpired
                                  ? "text-red-600 font-medium"
                                  : isExpiring
                                  ? "text-orange-600 font-medium"
                                  : ""
                              }
                            >
                              {driver.license_expiry
                                ? new Date(
                                    driver.license_expiry
                                  ).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>

                          {performance && (
                            <>
                              <div className="text-right">
                                <div className="text-muted-foreground">
                                  Trips
                                </div>
                                <div className="font-medium">
                                  {performance.totalTrips}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-muted-foreground">
                                  Completion Rate
                                </div>
                                <div className="font-medium">
                                  {performance.completionRate.toFixed(2)}%
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredDrivers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No drivers found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  licenseTypeFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first driver"}
                </p>
                {!searchTerm &&
                  statusFilter === "all" &&
                  licenseTypeFilter === "all" && (
                    <Button
                      onClick={() => setIsAddingDriver(true)}
                      variant="outline"
                      size="lg"
                      className="gap-2 text-white border-white/20"
                    >
                      <Plus className="mr-2 h-5 w-5" /> Add First Driver
                    </Button>
                  )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {drivers && trips && (
                <DriverAnalytics
                  drivers={drivers}
                  trips={trips}
                  selectedDriver={selectedDriver}
                />
              )}
            </div>
            <div>
              {drivers && (
                <DriverQuickActions
                  drivers={drivers}
                  onExportDrivers={handleExportDrivers}
                  onImportDrivers={handleImportDrivers}
                  onSendBulkMessage={handleSendBulkMessage}
                  onGenerateReport={handleGenerateReport}
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DriverFormDialog
        open={isAddingDriver || !!selectedDriver}
        onOpenChange={(open) => {
          setIsAddingDriver(open);
          if (!open) setSelectedDriver(undefined);
        }}
        driver={selectedDriver}
        onDriverDeleted={handleDriverDeleted}
      />
    </div>
  );
}
