import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Vehicle, VehicleStatus, VehicleType } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";
import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { VehicleDetailsDialog } from "@/components/vehicles/vehicle-details-dialog";
import { VehiclesEmptyState } from "@/components/vehicles/vehicles-empty-state";
import { VehiclesLoading } from "@/components/vehicles/vehicles-loading";
import { VehiclesError } from "@/components/vehicles/vehicles-error";
import { VehicleCards } from "@/components/vehicles/vehicle-cards";
import { VehicleFilters } from "@/components/vehicles/vehicle-filters";

export default function Vehicles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  const {
    data: vehicles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*, vehicle_images(image_url)")
        .order("created_at", { ascending: false });

      if (vehiclesError) {
        toast({
          title: "Error fetching vehicles",
          description: vehiclesError.message,
          variant: "destructive",
        });
        throw vehiclesError;
      }

      if (!vehiclesData) return [];

      const sanitizedVehicles = vehiclesData.map((v) => ({
        ...v,
        id: v.id || "",
        make: v.make || "Unknown",
        model: v.model || "Model",
        registration: v.registration || "N/A",
        type: v.type || "armoured",
        status: v.status || "active",
        year: v.year || null,
        color: v.color || "N/A",
        vin: v.vin || "N/A",
        insurance_expiry: v.insurance_expiry || null,
        notes: v.notes || "",
        created_at: v.created_at || new Date().toISOString(),
        updated_at: v.updated_at || new Date().toISOString(),
        vehicle_images: Array.isArray(v.vehicle_images) ? v.vehicle_images : [],
      }));

      return sanitizedVehicles as (Vehicle & {
        vehicle_images: { image_url: string }[];
      })[];
    },
  });

  // Filter vehicles based on search and filters
  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        searchTerm === "" ||
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || vehicle.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || vehicle.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, searchTerm, typeFilter, statusFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!vehicles)
      return {
        total: 0,
        active: 0,
        inService: 0,
        inactive: 0,
        armoured: 0,
        softSkin: 0,
      };

    return {
      total: vehicles.length,
      active: vehicles.filter((v) => v.status === "active").length,
      inService: vehicles.filter((v) => v.status === "in_service").length,
      inactive: vehicles.filter((v) => v.status === "inactive").length,
      armoured: vehicles.filter((v) => v.type === "armoured").length,
      softSkin: vehicles.filter((v) => v.type === "soft_skin").length,
    };
  }, [vehicles]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({
        title: "Vehicle deleted",
        description: "Vehicle has been successfully deleted",
      });
      setSelectedVehicle(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = useCallback(() => {
    if (selectedVehicle) {
      deleteMutation.mutate(selectedVehicle.id);
    }
  }, [selectedVehicle, deleteMutation]);

  const closeVehicleDetails = useCallback(() => {
    setSelectedVehicle(null);
  }, []);

  const handleVehicleClick = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  }, []);

  const handleAddVehicle = useCallback(() => {
    setFormOpen(true);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
  }, []);

  const hasActiveFilters =
    searchTerm !== "" || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">
            Manage your vehicle fleet and track their status
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleAddVehicle}>
          <Plus className="h-5 w-5" />
          Add Vehicle
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vehicles
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.armoured} armoured, {statistics.softSkin} soft skin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.active}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for service
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Service</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.inService}
            </div>
            <p className="text-xs text-muted-foreground">Currently on trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statistics.inactive}
            </div>
            <p className="text-xs text-muted-foreground">
              Maintenance or retired
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Vehicles</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="gap-1">
                  {filteredVehicles.length} of {vehicles?.length || 0}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("table")}
                className={viewMode === "table" ? "bg-muted" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("cards")}
                className={viewMode === "cards" ? "bg-muted" : ""}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VehicleFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <VehiclesLoading />
          ) : error ? (
            <VehiclesError />
          ) : filteredVehicles && filteredVehicles.length > 0 ? (
            viewMode === "table" ? (
              <VehicleTable
                vehicles={filteredVehicles}
                onVehicleClick={handleVehicleClick}
              />
            ) : (
              <VehicleCards
                vehicles={filteredVehicles}
                onVehicleClick={handleVehicleClick}
              />
            )
          ) : (
            <VehiclesEmptyState onAddVehicle={handleAddVehicle} />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <VehicleFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <VehicleDetailsDialog
        selectedVehicle={selectedVehicle}
        onClose={closeVehicleDetails}
        onDelete={handleDelete}
      />
    </div>
  );
}
