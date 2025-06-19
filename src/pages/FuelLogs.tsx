import React, { useState, useMemo, useEffect } from "react";
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
  getFuelTanks,
  getTankFills,
  getTankDispensed,
  addTankFill,
} from "@/components/fuel-log-form/services/fuel-log-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export default function FuelLogs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedFuelLog, setSelectedFuelLog] = useState<FuelLog | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
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
      return data as FuelLog[];
    },
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

  // Filter fuel logs based on search and filters
  const filteredFuelLogs = useMemo(() => {
    if (!fuelLogs) return [];

    return fuelLogs.filter((log) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
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
  }, [fuelLogs, searchTerm, vehicleFilter, fuelTypeFilter, dateRange]);

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
      const { error } = await supabase.from("fuel_logs").delete().eq("id", id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      toast({
        title: "Fuel log deleted",
        description: "The fuel log has been deleted successfully.",
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

  const [tanks, setTanks] = useState([]);
  const [tankStats, setTankStats] = useState({});
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);
  const [tankFills, setTankFills] = useState([]);
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
  const [editingFill, setEditingFill] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [allTankFills, setAllTankFills] = useState([]);

  useEffect(() => {
    async function fetchTankData() {
      const tanks = await getFuelTanks();
      setTanks(tanks);
      const stats = {};
      const allFills = [];

      for (const tank of tanks) {
        const fills = await getTankFills(tank.id);
        const dispensed = await getTankDispensed(tank.id);
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
    }
    fetchTankData();
  }, []);

  useEffect(() => {
    if (selectedTankId) {
      getTankFills(selectedTankId).then(setTankFills);
    }
  }, [selectedTankId, showFillDialog]);

  // Calculate cost analytics separated by fuel type
  const costAnalytics = React.useMemo(() => {
    const dieselStats = {
      totalSpent: 0,
      totalVolume: 0,
      fillCount: 0,
      avgCostPerLiter: 0,
    };
    const petrolStats = {
      totalSpent: 0,
      totalVolume: 0,
      fillCount: 0,
      avgCostPerLiter: 0,
    };

    // Calculate from all tank fills
    allTankFills.forEach((fill) => {
      const stats =
        fill.tank_fuel_type === "diesel" ? dieselStats : petrolStats;

      if (fill.total_cost) stats.totalSpent += Number(fill.total_cost);
      if (fill.amount) stats.totalVolume += Number(fill.amount);
      stats.fillCount++;
    });

    // Calculate average cost per liter
    if (dieselStats.totalVolume > 0) {
      dieselStats.avgCostPerLiter =
        dieselStats.totalSpent / dieselStats.totalVolume;
    }
    if (petrolStats.totalVolume > 0) {
      petrolStats.avgCostPerLiter =
        petrolStats.totalSpent / petrolStats.totalVolume;
    }

    return {
      diesel: dieselStats,
      petrol: petrolStats,
      total: {
        totalSpent: dieselStats.totalSpent + petrolStats.totalSpent,
        totalVolume: dieselStats.totalVolume + petrolStats.totalVolume,
        fillCount: dieselStats.fillCount + petrolStats.fillCount,
        avgCostPerLiter:
          dieselStats.totalVolume + petrolStats.totalVolume > 0
            ? (dieselStats.totalSpent + petrolStats.totalSpent) /
              (dieselStats.totalVolume + petrolStats.totalVolume)
            : 0,
      },
    };
  }, [allTankFills]);

  const handleAddFill = async () => {
    if (!selectedTankId) {
      toast({
        title: "No Tank Selected",
        description: "Please select a tank before saving a fill.",
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
      if (tank && projectedLevel > tank.capacity) {
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
          .from("tank_fills")
          .update({
            fill_date: fillForm.fill_date,
            amount: Number(fillForm.amount),
            cost_per_liter: Number(fillForm.cost_per_liter) || null,
            total_cost: Number(fillForm.total_cost) || null,
            supplier: fillForm.supplier,
            notes: fillForm.notes,
          })
          .eq("id", editingFill.id);
      } else {
        // Add new fill
        await addTankFill({
          tank_id: selectedTankId!,
          fill_date: fillForm.fill_date,
          amount: Number(fillForm.amount),
          cost_per_liter: Number(fillForm.cost_per_liter) || null,
          total_cost: Number(fillForm.total_cost) || null,
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
      if (selectedTankId) getTankFills(selectedTankId).then(setTankFills);
      // Also refresh all tank stats
      const refreshedTanks = await getFuelTanks();
      setTanks(refreshedTanks);
      const stats = {};
      const allFills = [];

      for (const tank of refreshedTanks) {
        const fills = await getTankFills(tank.id);
        const dispensed = await getTankDispensed(tank.id);
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
  const handleEditFill = (fill) => {
    setEditingFill(fill);
    setFillForm({
      fill_date: fill.fill_date,
      amount: fill.amount,
      cost_per_liter: fill.cost_per_liter || "",
      total_cost: fill.total_cost || "",
      supplier: fill.supplier || "",
      notes: fill.notes || "",
    });
    setShowFillDialog(true);
  };

  // Delete tank fill logic
  const handleDeleteFill = async () => {
    if (!editingFill) return;
    await supabase.from("tank_fills").delete().eq("id", editingFill.id);
    setShowDeleteDialog(false);
    setEditingFill(null);
    if (selectedTankId) getTankFills(selectedTankId).then(setTankFills);
    // Refresh tank stats
    const refreshedTanks = await getFuelTanks();
    setTanks(refreshedTanks);
    const stats = {};
    const allFills = [];

    for (const tank of refreshedTanks) {
      const fills = await getTankFills(tank.id);
      const dispensed = await getTankDispensed(tank.id);
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
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-8 animate-fade-in"
    >
      <TabsList className="mb-6">
        <TabsTrigger value="logs">Fuel Logs</TabsTrigger>
        <TabsTrigger value="tanks">Tank Management</TabsTrigger>
      </TabsList>
      <TabsContent value="logs">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Fuel Logs</h2>
            <p className="text-muted-foreground">
              Track fuel consumption and costs
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-white border-white/20"
              onClick={exportToCSV}
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button
              onClick={() => setFormOpen(true)}
              variant="outline"
              size="lg"
              className="gap-2 text-white border-white/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Log
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-400">
                Total Logs
              </CardTitle>
              <Fuel className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-300">
                {summaryStats.totalLogs}
              </div>
              <p className="text-xs text-blue-400/70">
                {summaryStats.recentLogs} in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-400">
                Total Cost
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-300">
                ${summaryStats.totalCost.toFixed(2)}
              </div>
              <p className="text-xs text-green-400/70">
                {summaryStats.highCostLogs} logs above $100
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">
                Total Volume
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-300">
                {summaryStats.totalVolume.toFixed(1)}L
              </div>
              <p className="text-xs text-purple-400/70">
                Avg: ${summaryStats.averageCostPerLiter.toFixed(2)}/L
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by vehicle, registration, or fuel type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Vehicles" />
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
                <SelectTrigger>
                  <SelectValue placeholder="All Fuel Types" />
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

              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="gap-2"
              >
                Clear Filters
              </Button>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchTerm}"
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
                    Vehicle:{" "}
                    {vehicles.find((v) => v.id === vehicleFilter)?.name}
                    <button
                      onClick={() => setVehicleFilter("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {fuelTypeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Fuel:{" "}
                    {fuelTypeFilter.charAt(0).toUpperCase() +
                      fuelTypeFilter.slice(1)}
                    <button
                      onClick={() => setFuelTypeFilter("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {(dateRange?.from || dateRange?.to) && (
                  <Badge variant="secondary" className="gap-1">
                    Date:{" "}
                    {dateRange.from
                      ? format(dateRange.from, "MMM dd")
                      : "Start"}{" "}
                    - {dateRange.to ? format(dateRange.to, "MMM dd") : "End"}
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
          </CardContent>
        </Card>

        {/* Fuel Logs Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Fuel Logs
              {hasActiveFilters && (
                <Badge variant="outline" className="ml-2">
                  {filteredFuelLogs.length} of {fuelLogs?.length || 0}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Fuel Type</TableHead>
                    <TableHead>Volume (L)</TableHead>
                    <TableHead>Cost (USD)</TableHead>
                    <TableHead>Cost/L (USD)</TableHead>
                    <TableHead>Distance (km)</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Loading fuel logs...
                        </div>
                      </TableCell>
                    </TableRow>
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
                    filteredFuelLogs.map((log) => {
                      const costPerLiter =
                        log.volume > 0 ? log.cost / log.volume : 0;
                      const isHighCost = log.cost > 100;

                      return (
                        <TableRow key={log.id} className="hover:bg-muted/50">
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
                                log.fuel_type === "cng" &&
                                  "border-purple-500/30 text-purple-400"
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
          </CardContent>
        </Card>

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
        {/* Cost Analytics Summary Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-400">
                Diesel Costs
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-300">
                ${costAnalytics.diesel.totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-blue-400/70">
                {costAnalytics.diesel.totalVolume.toFixed(1)}L • $
                {costAnalytics.diesel.avgCostPerLiter.toFixed(2)}/L
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-400">
                Petrol Costs
              </CardTitle>
              <Fuel className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-300">
                ${costAnalytics.petrol.totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-green-400/70">
                {costAnalytics.petrol.totalVolume.toFixed(1)}L • $
                {costAnalytics.petrol.avgCostPerLiter.toFixed(2)}/L
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">
                Total Spent
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-300">
                ${costAnalytics.total.totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-purple-400/70">
                {costAnalytics.total.fillCount} fills • $
                {costAnalytics.total.avgCostPerLiter.toFixed(2)}/L avg
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 flex flex-wrap gap-4">
          {tanks.map((tank) => {
            let currentLevel = tankStats[tank.id]?.currentLevel ?? 0;
            if (currentLevel > tank.capacity) currentLevel = tank.capacity;
            const percent =
              tank.capacity > 0
                ? Math.max(
                    0,
                    Math.min(100, (currentLevel / tank.capacity) * 100)
                  )
                : 0;
            let barColor = "bg-green-500";
            if (percent < 20) barColor = "bg-red-500";
            else if (percent < 50) barColor = "bg-yellow-500";
            // Remove 'Underground' from name
            const displayName = tank.name.replace(/underground/i, "").trim();
            let levelLabel = "Full";
            if (percent < 20) levelLabel = "Low";
            else if (percent < 50) levelLabel = "Medium";
            return (
              <Card key={tank.id} className="w-96">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fuel className="h-6 w-6 text-blue-500" />
                    {displayName} ({tank.fuel_type})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 text-sm">
                    Capacity: {tank.capacity} L
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative w-full h-8 bg-background rounded-full overflow-hidden border">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                          <div
                            className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                              percent > 10 ? "text-white" : "text-foreground"
                            }`}
                          >
                            {currentLevel} L ({percent.toFixed(0)}%)
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>{levelLabel}</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last Fill:{" "}
                    {tankStats[tank.id]?.lastFillDate
                      ? `${tankStats[tank.id].lastFillAmount} L on ${
                          tankStats[tank.id].lastFillDate
                        }`
                      : "-"}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mb-4 flex items-center gap-4">
          <Select
            value={selectedTankId || ""}
            onValueChange={setSelectedTankId}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a tank" />
            </SelectTrigger>
            <SelectContent>
              {tanks.map((tank) => (
                <SelectItem key={tank.id} value={tank.id}>
                  {tank.name} ({tank.fuel_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowFillDialog(true)}
            disabled={!selectedTankId}
          >
            Add Tank Fill
          </Button>
          <Button
            variant="outline"
            onClick={exportTankFills}
            disabled={!tankFills.length}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Export History
          </Button>
        </div>
        {selectedTankId && (
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
