import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Pencil,
  Trash2,
  Search,
  Filter,
  Download,
  Fuel,
  DollarSign,
  Calendar,
  Car,
  TrendingUp,
  AlertTriangle,
  MoreVertical,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { FuelLog } from "@/lib/types";
import { FuelLogFormDialog } from "@/components/fuel-log-form-dialog";
import { useToast } from "@/hooks/use-toast";
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
import {
  format,
  isValid,
  parseISO,
  subDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  getFuelStorages,
  getFuelFills,
  getStorageDispensed,
  addFuelFill,
  broadcastTankUpdate,
} from "@/components/fuel-log-form/services/fuel-log-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { safeArrayResult, safeSingleResult } from "@/lib/utils/type-guards";
import type { Tank, TankFill, TankStats } from "@/lib/types";

function FuelLogs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedFuelLog, setSelectedFuelLog] = useState<FuelLog | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>();

  const { data: fuelLogs, isLoading } = useQuery({
    queryKey: ["fuel-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fuel_logs")
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
        .order("date", { ascending: false });

      if (error) throw error;
      return safeArrayResult<FuelLog>(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Get unique vehicles and fuel types for filters
  const vehicles = useMemo(() => {
    if (!fuelLogs) return [];
    const uniqueVehicles = new Map();
    fuelLogs.forEach((log) => {
      if (log.vehicle) {
        const key = log.vehicle_id;
        if (!uniqueVehicles.has(key)) {
          uniqueVehicles.set(key, {
            id: log.vehicle_id,
            name: `${log.vehicle.make} ${log.vehicle.model}`,
            registration: log.vehicle.registration,
          });
        }
      }
    });
    return Array.from(uniqueVehicles.values());
  }, [fuelLogs]);

  const fuelTypes = useMemo(() => {
    if (!fuelLogs) return [];
    const types = new Set(fuelLogs.map((log) => log.fuel_type));
    return Array.from(types);
  }, [fuelLogs]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter fuel logs based on search and filters
  const filteredFuelLogs = useMemo(() => {
    if (!fuelLogs) return [];

    return fuelLogs.filter((log) => {
      // Search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const vehicleName = log.vehicle
          ? `${log.vehicle.make} ${log.vehicle.model}`.toLowerCase()
          : "";
        const registration = log.vehicle?.registration?.toLowerCase() || "";
        const fuelType = log.fuel_type.toLowerCase();

        if (
          !vehicleName.includes(searchLower) &&
          !registration.includes(searchLower) &&
          !fuelType.includes(searchLower)
        ) {
          return false;
        }
      }

      // Vehicle filter
      if (vehicleFilter !== "all" && log.vehicle_id !== vehicleFilter) {
        return false;
      }

      // Fuel type filter
      if (fuelTypeFilter !== "all" && log.fuel_type !== fuelTypeFilter) {
        return false;
      }

      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const logDate = parseISO(log.date);
        if (dateRange.from && logDate < dateRange.from) return false;
        if (dateRange.to && logDate > dateRange.to) return false;
      }

      return true;
    });
  }, [fuelLogs, debouncedSearchTerm, vehicleFilter, fuelTypeFilter, dateRange]);

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const fuelLogsPerPage = 20;
  const totalPages = Math.ceil(filteredFuelLogs.length / fuelLogsPerPage);
  const startIndex = (currentPage - 1) * fuelLogsPerPage;
  const endIndex = startIndex + fuelLogsPerPage;
  const paginatedFuelLogs = filteredFuelLogs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, vehicleFilter, fuelTypeFilter, dateRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredFuelLogs)
      return {
        totalLogs: 0,
        totalCost: 0,
        totalVolume: 0,
        averageCostPerLiter: 0,
        recentLogs: 0,
        highCostLogs: 0,
      };

    const totalLogs = filteredFuelLogs.length;
    const totalCost = filteredFuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalVolume = filteredFuelLogs.reduce(
      (sum, log) => sum + log.volume,
      0
    );
    const averageCostPerLiter = totalVolume > 0 ? totalCost / totalVolume : 0;

    // Recent logs (last 7 days)
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentLogs = filteredFuelLogs.filter(
      (log) => parseISO(log.date) >= sevenDaysAgo
    ).length;

    // High cost logs (above $100)
    const highCostLogs = filteredFuelLogs.filter(
      (log) => log.cost > 100
    ).length;

    return {
      totalLogs,
      totalCost,
      totalVolume,
      averageCostPerLiter,
      recentLogs,
      highCostLogs,
    };
  }, [filteredFuelLogs]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("fuel_logs")
        .delete()
        .eq("id", id as any);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });

      // Broadcast tank update to refresh tank progress
      broadcastTankUpdate();

      toast({
        title: "Fuel log deleted",
        description:
          "The fuel log has been deleted successfully. Tank levels updated.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to delete fuel log",
        variant: "destructive",
      });
    }
  };

  const formatDateCell = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = parseISO(dateString);
    if (!isValid(date)) return "Invalid Date";
    return format(date, "dd/MM/yyyy");
  };

  const exportToCSV = () => {
    if (!filteredFuelLogs || filteredFuelLogs.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no fuel logs to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Date",
      "Vehicle",
      "Registration",
      "Fuel Type",
      "Volume (L)",
      "Cost (USD)",
      "Previous Mileage (km)",
      "Current Mileage (km)",
      "Distance (km)",
      "Cost per Liter (USD)",
      "Notes",
    ];

    const csvData = filteredFuelLogs.map((log) => [
      formatDateCell(log.date),
      log.vehicle
        ? `${log.vehicle.make} ${log.vehicle.model}`
        : "Unknown Vehicle",
      log.vehicle?.registration || "",
      log.fuel_type,
      log.volume.toFixed(1),
      log.cost.toFixed(2),
      log.previous_mileage?.toLocaleString() || "",
      log.current_mileage?.toLocaleString() || "",
      log.mileage?.toLocaleString() || "",
      log.volume > 0 ? (log.cost / log.volume).toFixed(2) : "0.00",
      log.notes || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${filteredFuelLogs.length} fuel logs to CSV.`,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setVehicleFilter("all");
    setFuelTypeFilter("all");
    setDateRange(undefined);
  };

  const hasActiveFilters =
    searchTerm ||
    vehicleFilter !== "all" ||
    fuelTypeFilter !== "all" ||
    dateRange?.from ||
    dateRange?.to;

  // Tank management states with proper types
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [tankStats, setTankStats] = useState<Record<string, TankStats>>({});
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);
  const [tankFills, setTankFills] = useState<TankFill[]>([]);
  const [showFillDialog, setShowFillDialog] = useState(false);
  const [fillForm, setFillForm] = useState({
    fill_date: "",
    amount: "",
    cost_per_liter: "",
    total_cost: "",
    supplier: "",
    notes: "",
  });
  const [isSubmittingFill, setIsSubmittingFill] = useState(false);
  const [activeTab, setActiveTab] = useState("logs");
  const [editingFill, setEditingFill] = useState<TankFill | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [allTankFills, setAllTankFills] = useState<TankFill[]>([]);
  const [isLoadingTanks, setIsLoadingTanks] = useState(false);
  const [tankError, setTankError] = useState<string | null>(null);

  // Function to fetch and update fuel storage data
  const fetchTankData = useCallback(async () => {
    setIsLoadingTanks(true);
    setTankError(null);

    try {
      const tanksData = await getFuelStorages();
      const tanks = safeArrayResult<Tank>(tanksData);

      if (!tanks || tanks.length === 0) {
        setTanks([]);
        setTankStats({});
        setAllTankFills([]);
        setIsLoadingTanks(false);
        return;
      }

      setTanks(tanks);

      // Process tanks in parallel for better performance
      const tankPromises = tanks.map(async (tank) => {
        try {
          const [fillsData, dispensedData] = await Promise.all([
            getFuelFills(tank.id),
            getStorageDispensed(tank.id),
          ]);

          const fills = safeArrayResult<TankFill>(fillsData);
          const dispensed = safeSingleResult<number>(dispensedData) || 0;

          const totalFilled = fills.reduce(
            (sum, f) => sum + (f.amount || 0),
            0
          );
          const lastFill = fills[0];

          const stats: TankStats = {
            currentLevel: totalFilled - dispensed,
            lastFillDate: lastFill?.fill_date,
            lastFillAmount: lastFill?.amount,
          };

          const fillsWithTankInfo: TankFill[] = fills.map((fill) => ({
            ...fill,
            tank_fuel_type: tank.fuel_type,
          }));

          return { tankId: tank.id, stats, fills: fillsWithTankInfo };
        } catch (tankError) {
          console.error(`Error processing tank ${tank.id}:`, tankError);
          return {
            tankId: tank.id,
            stats: {} as TankStats,
            fills: [] as TankFill[],
          };
        }
      });

      const results = await Promise.all(tankPromises);

      const stats: Record<string, TankStats> = {};
      const allFills: TankFill[] = [];

      results.forEach(({ tankId, stats: tankStats, fills }) => {
        stats[tankId] = tankStats;
        allFills.push(...fills);
      });

      setTankStats(stats);
      setAllTankFills(allFills);
    } catch (error: any) {
      console.error("Error fetching tank data:", error);

      const errorMessage =
        (error?.message as string) ||
        (error?.details as string) ||
        (error?.hint as string) ||
        "Failed to fetch fuel tank data. Please check your connection and try again.";
      setTankError(errorMessage);

      setTanks([]);
      setTankStats({});
      setAllTankFills([]);
    } finally {
      setIsLoadingTanks(false);
    }
  }, []);

  useEffect(() => {
    fetchTankData();
  }, []);

  // Listen for fuel storage update events from fuel log form
  useEffect(() => {
    const handleTankUpdate = () => {
      console.log("Fuel storage update event received, refreshing data...");
      fetchTankData();
    };

    window.addEventListener("fuelStorageDataUpdate", handleTankUpdate);

    return () => {
      window.removeEventListener("fuelStorageDataUpdate", handleTankUpdate);
    };
  }, []);

  useEffect(() => {
    if (selectedTankId) {
      getFuelFills(selectedTankId).then((fills) => setTankFills(fills as any));
    }
  }, [selectedTankId, showFillDialog]);

  // Calculate cost analytics separated by fuel type
  const costAnalytics = useMemo(() => {
    if (!allTankFills.length) {
      return {
        diesel: {
          totalSpent: 0,
          totalVolume: 0,
          fillCount: 0,
          avgCostPerLiter: 0,
        },
        petrol: {
          totalSpent: 0,
          totalVolume: 0,
          fillCount: 0,
          avgCostPerLiter: 0,
        },
        total: {
          totalSpent: 0,
          totalVolume: 0,
          fillCount: 0,
          avgCostPerLiter: 0,
        },
      };
    }

    type FuelStats = {
      totalSpent: number;
      totalVolume: number;
      fillCount: number;
      avgCostPerLiter?: number;
    };
    const stats = allTankFills.reduce(
      (acc: { diesel: FuelStats; petrol: FuelStats }, fill) => {
        const fuelType = fill.tank_fuel_type === "diesel" ? "diesel" : "petrol";
        const stats = acc[fuelType];

        if (fill.total_cost) stats.totalSpent += Number(fill.total_cost);
        if (fill.amount) stats.totalVolume += Number(fill.amount);
        stats.fillCount++;

        return acc;
      },
      {
        diesel: { totalSpent: 0, totalVolume: 0, fillCount: 0 },
        petrol: { totalSpent: 0, totalVolume: 0, fillCount: 0 },
      }
    );

    // Calculate averages
    if (stats.diesel.totalVolume > 0) {
      stats.diesel.avgCostPerLiter =
        stats.diesel.totalSpent / stats.diesel.totalVolume;
    }
    if (stats.petrol.totalVolume > 0) {
      stats.petrol.avgCostPerLiter =
        stats.petrol.totalSpent / stats.petrol.totalVolume;
    }

    const total: FuelStats & { avgCostPerLiter: number } = {
      totalSpent: stats.diesel.totalSpent + stats.petrol.totalSpent,
      totalVolume: stats.diesel.totalVolume + stats.petrol.totalVolume,
      fillCount: stats.diesel.fillCount + stats.petrol.fillCount,
      avgCostPerLiter: 0,
    };

    if (total.totalVolume > 0) {
      total.avgCostPerLiter = total.totalSpent / total.totalVolume;
    }

    return { diesel: stats.diesel, petrol: stats.petrol, total };
  }, [allTankFills]);

  const handleAddFill = async () => {
    if (!selectedTankId) {
      toast({
        title: "No Storage Selected",
        description: "Please select a storage before saving a fill.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmittingFill(true);
    try {
      // Calculate projected new level
      let projectedLevel = tankStats[selectedTankId]?.currentLevel ?? 0;
      if (editingFill) {
        // If editing, subtract the old amount and add the new
        projectedLevel =
          projectedLevel - Number(editingFill.amount) + Number(fillForm.amount);
      } else {
        projectedLevel += Number(fillForm.amount);
      }
      const tank = tanks.find((t) => t.id === selectedTankId);
      if (
        tank &&
        typeof tank.capacity === "number" &&
        projectedLevel > tank.capacity
      ) {
        toast({
          title: "Tank Overfill Prevented",
          description: `This fill would exceed the tank's capacity (${tank.capacity} L). Please enter a lower amount.`,
          variant: "destructive",
        });
        setIsSubmittingFill(false);
        return;
      }
      if (editingFill) {
        // Update existing fill
        await supabase
          .from("tank_fills" as any)
          .update({
            fill_date: fillForm.fill_date,
            amount: Number(fillForm.amount),
            cost_per_liter: Number(fillForm.cost_per_liter) || null,
            total_cost: Number(fillForm.total_cost) || null,
            supplier: fillForm.supplier,
            notes: fillForm.notes,
          } as any)
          .eq("id", editingFill.id as any);
      } else {
        // Add new fill
        await addFuelFill({
          fuel_management_id: selectedTankId!,
          fill_date: fillForm.fill_date,
          amount: Number(fillForm.amount),
          cost_per_liter: Number(fillForm.cost_per_liter) || undefined,
          total_cost: Number(fillForm.total_cost) || undefined,
          supplier: fillForm.supplier,
          notes: fillForm.notes,
        });
      }
      setShowFillDialog(false);
      setFillForm({
        fill_date: "",
        amount: "",
        cost_per_liter: "",
        total_cost: "",
        supplier: "",
        notes: "",
      });
      setEditingFill(null);
      // Refresh tank stats and fills
      if (selectedTankId)
        getFuelFills(selectedTankId).then((fills) =>
          setTankFills(fills as any)
        );
      // Also refresh all tank stats
      const refreshedTanks = await getFuelStorages();
      setTanks(refreshedTanks as any);
      const stats: Record<string, TankStats> = {};
      const allFills: TankFill[] = [];

      const refreshedList = safeArrayResult<Tank>(refreshedTanks);
      for (const tank of refreshedList) {
        const fills = (await getFuelFills(tank.id)) as any[];
        const dispensed = (await getStorageDispensed(tank.id)) as any;
        const totalFilled = fills.reduce((sum, f) => sum + (f.amount || 0), 0);
        const lastFill = fills[0];
        stats[tank.id] = {
          currentLevel: totalFilled - dispensed,
          lastFillDate: lastFill?.fill_date,
          lastFillAmount: lastFill?.amount,
        };

        // Add tank info to fills for cost analytics
        const fillsWithTankInfo = fills.map((fill) => ({
          ...fill,
          tank_fuel_type: tank.fuel_type,
        }));
        allFills.push(...fillsWithTankInfo);
      }

      setTankStats(stats);
      setAllTankFills(allFills);
    } catch (e) {
      toast({
        title: "Error Saving Fill",
        description:
          e instanceof Error ? e.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFill(false);
    }
  };

  // Export tank fills to CSV
  const exportTankFills = () => {
    if (!tankFills.length) return;
    const csvRows = [
      [
        "Date",
        "Amount (L)",
        "Cost per Liter",
        "Total Cost",
        "Supplier",
        "Notes",
      ],
      ...tankFills.map((f) => [
        f.fill_date,
        f.amount,
        f.cost_per_liter || "",
        f.total_cost || "",
        f.supplier || "",
        f.notes || "",
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tank_fills.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Edit tank fill logic
  const handleEditFill = (fill: TankFill) => {
    setEditingFill(fill);
    setFillForm({
      fill_date: fill.fill_date,
      amount: String(fill.amount),
      cost_per_liter: fill.cost_per_liter ? String(fill.cost_per_liter) : "",
      total_cost: fill.total_cost ? String(fill.total_cost) : "",
      supplier: fill.supplier || "",
      notes: fill.notes || "",
    });
    setShowFillDialog(true);
  };

  // Delete tank fill logic
  const handleDeleteFill = async () => {
    if (!editingFill) return;
    await supabase
      .from("tank_fills" as any)
      .delete()
      .eq("id", editingFill.id as any);
    setShowDeleteDialog(false);
    setEditingFill(null);
    if (selectedTankId)
      getFuelFills(selectedTankId).then((fills) => setTankFills(fills as any));
    // Refresh tank stats
    const refreshedTanks = await getFuelStorages();
    setTanks(refreshedTanks as any);
    const stats: Record<string, TankStats> = {};
    const allFills: TankFill[] = [];

    const refreshedList = safeArrayResult<Tank>(refreshedTanks);
    for (const tank of refreshedList) {
      const fills = (await getFuelFills(tank.id)) as any[];
      const dispensed = (await getStorageDispensed(tank.id)) as any;
      const totalFilled = fills.reduce((sum, f) => sum + (f.amount || 0), 0);
      const lastFill = fills[0];
      stats[tank.id] = {
        currentLevel: totalFilled - dispensed,
        lastFillDate: lastFill?.fill_date,
        lastFillAmount: lastFill?.amount,
      };

      // Add tank info to fills for cost analytics
      const fillsWithTankInfo = fills.map((fill) => ({
        ...fill,
        tank_fuel_type: tank.fuel_type,
      }));
      allFills.push(...fillsWithTankInfo);
    }

    setTankStats(stats);
    setAllTankFills(allFills);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <TabsList>
          <TabsTrigger value="logs">Fuel Logs</TabsTrigger>
          <TabsTrigger value="tanks">Fuel Management</TabsTrigger>
        </TabsList>
        {activeTab === "logs" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-foreground border-border/50"
              onClick={exportToCSV}
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button
              onClick={() => setFormOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 text-foreground border-border/50"
            >
              Add Log
            </Button>
          </div>
        )}
      </div>
      <TabsContent value="logs">
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Section */}
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by vehicle, registration, or fuel type..."
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
            <div className="flex items-center gap-3">
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger className="w-[140px] h-11 border-border/50 focus:border-primary/50">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.registration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
                <SelectTrigger className="w-[140px] h-11 border-border/50 focus:border-primary/50">
                  <SelectValue placeholder="Fuel Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fuel Types</SelectItem>
                  {fuelTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-3 border-t border-border/20">
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
                {vehicleFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Vehicle:{" "}
                    {vehicles.find((v) => v.id === vehicleFilter)?.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setVehicleFilter("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {fuelTypeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Fuel:{" "}
                    {fuelTypeFilter.charAt(0).toUpperCase() +
                      fuelTypeFilter.slice(1)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setFuelTypeFilter("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {(dateRange?.from || dateRange?.to) && (
                  <Badge variant="secondary" className="gap-1">
                    Date:{" "}
                    {dateRange.from
                      ? format(dateRange.from, "MMM dd")
                      : "Start"}{" "}
                    - {dateRange.to ? format(dateRange.to, "MMM dd") : "End"}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setDateRange(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Fuel Logs Table */}
        <div className="space-y-6 mt-8">
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Vehicle</TableHead>
                  <TableHead className="font-medium">Fuel Type</TableHead>
                  <TableHead className="font-medium">Volume (L)</TableHead>
                  <TableHead className="font-medium">Cost (USD)</TableHead>
                  <TableHead className="font-medium">Cost/L (USD)</TableHead>
                  <TableHead className="font-medium">Distance (km)</TableHead>
                  <TableHead className="w-[100px] font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : filteredFuelLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Fuel className="h-8 w-8" />
                        {hasActiveFilters ? (
                          <>
                            <p className="font-medium">
                              No fuel logs match your filters
                            </p>
                            <p className="text-sm">
                              Try adjusting your search criteria
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearFilters}
                            >
                              Clear Filters
                            </Button>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">No fuel logs found</p>
                            <p className="text-sm">
                              Add your first fuel log to get started
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFormOpen(true)}
                            >
                              Add First Log
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFuelLogs.map((log) => {
                    const costPerLiter =
                      log.volume > 0 ? log.cost / log.volume : 0;
                    const isHighCost = log.cost > 100;

                    return (
                      <TableRow
                        key={log.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDateCell(log.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {log.vehicle
                                ? `${log.vehicle.make} ${log.vehicle.model}`
                                : "Unknown Vehicle"}
                            </span>
                            {log.vehicle?.registration && (
                              <span className="text-xs text-muted-foreground">
                                {log.vehicle.registration}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              log.fuel_type === "diesel" &&
                                "border-blue-500/30 text-blue-400",
                              log.fuel_type === "petrol" &&
                                "border-green-500/30 text-green-400",
                              false && ""
                            )}
                          >
                            {log.fuel_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {log.volume.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                "font-mono",
                                isHighCost && "text-orange-400 font-semibold"
                              )}
                            >
                              ${log.cost.toFixed(2)}
                            </span>
                            {isHighCost && (
                              <AlertTriangle className="h-3 w-3 text-orange-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          ${costPerLiter.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {log.mileage ? log.mileage.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedFuelLog(log);
                                setFormOpen(true);
                              }}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedFuelLog(log);
                                setShowDeleteConfirm(true);
                              }}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results Count and Pagination Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredFuelLogs.length)} of{" "}
                {filteredFuelLogs.length} fuel logs
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Page {currentPage} of {totalPages}
              </span>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {filteredFuelLogs.length} of {fuelLogs?.length || 0}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Form Dialog */}
        <FuelLogFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setSelectedFuelLog(null);
          }}
          fuelLog={selectedFuelLog || undefined}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Fuel Log</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this fuel log? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedFuelLog) {
                    handleDelete(selectedFuelLog.id);
                    setShowDeleteConfirm(false);
                    setSelectedFuelLog(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TabsContent>
      <TabsContent value="tanks">
        {/* Summary cards removed per requirements */}

        {/* Storage cards removed per requirements */}
        <div className="mb-4 flex items-center gap-4">
          <Select
            value={selectedTankId || ""}
            onValueChange={setSelectedTankId}
            disabled={isLoadingTanks}
          >
            <SelectTrigger className="w-64">
              <SelectValue
                placeholder={
                  isLoadingTanks
                    ? "Loading tanks..."
                    : tanks.length === 0
                    ? "No tanks available"
                    : "Select storage"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isLoadingTanks ? (
                <SelectItem value="" disabled>
                  Loading tanks...
                </SelectItem>
              ) : tankError ? (
                <SelectItem value="" disabled>
                  Error loading tanks
                </SelectItem>
              ) : tanks.length === 0 ? (
                <SelectItem value="" disabled>
                  No tanks found
                </SelectItem>
              ) : (
                tanks.map((tank) => (
                  <SelectItem key={tank.id} value={tank.id}>
                    {tank.fuel_type}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {tankError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>{tankError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTankData}
                disabled={isLoadingTanks}
                className="h-6 px-2 text-xs"
              >
                Retry
              </Button>
            </div>
          )}

          <Button
            onClick={() => setShowFillDialog(true)}
            disabled={!selectedTankId || isLoadingTanks}
          >
            Add Fill
          </Button>
          <Button
            variant="outline"
            onClick={exportTankFills}
            disabled={!tankFills.length || isLoadingTanks}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
        {selectedTankId && (
          <div className="space-y-4">
            {isLoadingTanks ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Loading tank data...</span>
                </div>
              </div>
            ) : tankError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-red-600 mb-2">{tankError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTankData}
                    disabled={isLoadingTanks}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount (L)</TableHead>
                    <TableHead>Cost/L</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tankFills.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No fill history for this tank.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tankFills.map((fill) => (
                      <TableRow key={fill.id}>
                        <TableCell>{fill.fill_date}</TableCell>
                        <TableCell>{fill.amount}</TableCell>
                        <TableCell>
                          {fill.cost_per_liter
                            ? `$${Number(fill.cost_per_liter).toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {fill.total_cost
                            ? `$${Number(fill.total_cost).toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell>{fill.supplier || "-"}</TableCell>
                        <TableCell>{fill.notes || "-"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleEditFill(fill)}
                              >
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingFill(fill);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        )}

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

        {/* Add/Edit Tank Fill Dialog */}
        <Dialog open={showFillDialog} onOpenChange={setShowFillDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFill ? "Edit Tank Fill" : "Add Tank Fill"}
              </DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddFill();
              }}
            >
              <div>
                <label className="block mb-1">Date</label>
                <Input
                  type="date"
                  value={fillForm.fill_date}
                  onChange={(e) =>
                    setFillForm((f) => ({ ...f, fill_date: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Amount (L)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={fillForm.amount}
                  onChange={(e) =>
                    setFillForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Cost per Liter</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fillForm.cost_per_liter}
                    onChange={(e) => {
                      const newCostPerLiter = e.target.value;
                      setFillForm((f) => {
                        const amount = Number(f.amount);
                        const costPerLiter = Number(newCostPerLiter);
                        const totalCost =
                          amount && costPerLiter
                            ? (amount * costPerLiter).toFixed(2)
                            : "";
                        return {
                          ...f,
                          cost_per_liter: newCostPerLiter,
                          total_cost: totalCost,
                        };
                      });
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block mb-1">Total Cost</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={fillForm.total_cost}
                    onChange={(e) => {
                      const newTotalCost = e.target.value;
                      setFillForm((f) => {
                        const amount = Number(f.amount);
                        const totalCost = Number(newTotalCost);
                        const costPerLiter =
                          amount && totalCost
                            ? (totalCost / amount).toFixed(2)
                            : "";
                        return {
                          ...f,
                          total_cost: newTotalCost,
                          cost_per_liter: costPerLiter,
                        };
                      });
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1">Supplier</label>
                <Input
                  type="text"
                  value={fillForm.supplier}
                  onChange={(e) =>
                    setFillForm((f) => ({ ...f, supplier: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block mb-1">Notes</label>
                <Input
                  type="text"
                  value={fillForm.notes}
                  onChange={(e) =>
                    setFillForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmittingFill || !selectedTankId}
                className="w-full"
              >
                {isSubmittingFill ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : editingFill ? (
                  "Save Changes"
                ) : (
                  "Save Fill"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tank Fill</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this tank fill? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFill}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TabsContent>
    </Tabs>
  );
}

export default React.memo(FuelLogs);
