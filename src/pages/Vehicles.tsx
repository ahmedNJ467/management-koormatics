import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Vehicle } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";
import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { VehicleDetailsDialog } from "@/components/vehicles/vehicle-details-dialog";
import { VehiclesEmptyState } from "@/components/vehicles/vehicles-empty-state";
import { VehiclesLoading } from "@/components/vehicles/vehicles-loading";
import { VehiclesError } from "@/components/vehicles/vehicles-error";

export default function Vehicles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*, vehicle_images(image_url)')
        .order('created_at', { ascending: false });
      
      if (vehiclesError) {
        toast({
          title: "Error fetching vehicles",
          description: vehiclesError.message,
          variant: "destructive",
        });
        throw vehiclesError;
      }
      
      if (!vehiclesData) return [];

      // Comprehensive data sanitization to prevent any undefined property errors
      const sanitizedVehicles = vehiclesData.map(v => ({
        ...v,
        id: v.id || '',
        make: v.make || 'Unknown',
        model: v.model || 'Model',
        registration: v.registration || 'N/A',
        type: v.type || 'armoured',
        status: v.status || 'active',
        year: v.year || null,
        color: v.color || 'N/A',
        vin: v.vin || 'N/A',
        insurance_expiry: v.insurance_expiry || null,
        notes: v.notes || '',
        created_at: v.created_at || new Date().toISOString(),
        updated_at: v.updated_at || new Date().toISOString(),
        vehicle_images: Array.isArray(v.vehicle_images) ? v.vehicle_images : [],
      }));

      console.log('Sanitized vehicles data:', sanitizedVehicles);
      return sanitizedVehicles as (Vehicle & { vehicle_images: { image_url: string }[] })[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">Manage your fleet vehicles</p>
        </div>
        <Button onClick={handleAddVehicle}>
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <VehiclesLoading />
        ) : error ? (
          <VehiclesError />
        ) : vehicles && vehicles.length > 0 ? (
          <VehicleTable vehicles={vehicles} onVehicleClick={handleVehicleClick} />
        ) : (
          <VehiclesEmptyState onAddVehicle={handleAddVehicle} />
        )}
      </div>

      <VehicleFormDialog 
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <VehicleDetailsDialog
        selectedVehicle={selectedVehicle}
        onClose={closeVehicleDetails}
        onDelete={handleDelete}
      />
    </div>
  );
}
