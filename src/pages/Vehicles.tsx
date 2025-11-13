import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VehiclesEmptyState } from "@/components/vehicles/vehicles-empty-state";
import { VehiclesLoading } from "@/components/vehicles/vehicles-loading";
import { VehiclesError } from "@/components/vehicles/vehicles-error";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";
import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { VehicleDetailsDialog } from "@/components/vehicles/vehicle-details-dialog";
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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const vehiclesPerPage = 20;

  const initialVehiclesRef = useRef<Vehicle[] | undefined>(
    queryClient.getQueryData<Vehicle[]>(["vehicles"])
  );

  const {
    data: vehicles = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select(
          "id, make, model, registration, type, status, year, color, vin, insurance_expiry, notes, created_at, updated_at, images"
        )
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

      // Optimize data transformation - only set defaults where needed
      const sanitizedVehicles = vehiclesData.map((v: any) => ({
        id: v.id || "",
        make: v.make || "",
        model: v.model || "",
        registration: v.registration || "",
        type: v.type || "",
        status: v.status || "active",
        year: v.year ?? null,
        color: v.color || "",
        vin: v.vin || "",
        insurance_expiry: v.insurance_expiry ?? null,
        notes: v.notes || "",
        created_at: v.created_at || new Date().toISOString(),
        updated_at: v.updated_at || new Date().toISOString(),
        images: Array.isArray(v.images) ? v.images : [],
      }));

      return sanitizedVehicles as Vehicle[];
    },
    initialData: initialVehiclesRef.current,
    placeholderData: () => initialVehiclesRef.current ?? [],
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: !initialVehiclesRef.current,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
        (vehicle.vin || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || vehicle.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || vehicle.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, searchTerm, typeFilter, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);
  const startIndex = (currentPage - 1) * vehiclesPerPage;
  const endIndex = startIndex + vehiclesPerPage;
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

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
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id as any);
      if (error) throw error;
      return id;
    },
    onSuccess: async () => {
      // Mark that updates have occurred
      const { cacheInvalidationManager } = await import("@/lib/cache-invalidation");
      cacheInvalidationManager.markRecentUpdates();
      
      // Remove cached data to force fresh fetch
      queryClient.removeQueries({ queryKey: ["vehicles"] });
      
      // Invalidate and refetch to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
        queryClient.refetchQueries({ queryKey: ["vehicles"] }),
      ]);
      
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
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Vehicles
              </h1>
              {isFetching && vehicles.length > 0 && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Refreshing data…
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-foreground border-border/50"
              onClick={handleAddVehicle}
            >
              Add Vehicle
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4">
          <VehicleFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>

        {/* Content */}
        {error ? (
          <VehiclesError />
        ) : (!vehicles.length && isLoading) ? (
          <VehiclesLoading />
        ) : vehicles && vehicles.length > 0 ? (
          viewMode === "table" ? (
            <VehicleTable
              vehicles={paginatedVehicles}
              onVehicleClick={handleVehicleClick}
              isLoading={isLoading && vehicles.length === 0}
            />
          ) : (
            <VehicleCards
              vehicles={paginatedVehicles}
              onVehicleClick={handleVehicleClick}
            />
          )
        ) : (
          <VehiclesEmptyState onAddVehicle={handleAddVehicle} />
        )}

        {/* Results Count and Pagination Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {startIndex + 1}-
              {Math.min(endIndex, filteredVehicles.length)} of{" "}
              {filteredVehicles.length} vehicles
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

        {/* Dialogs */}
        <VehicleFormDialog open={formOpen} onOpenChange={setFormOpen} />

        <VehicleDetailsDialog
          selectedVehicle={selectedVehicle}
          onClose={closeVehicleDetails}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}