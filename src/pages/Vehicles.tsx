
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Car } from "lucide-react";
import { Vehicle } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";

export default function Vehicles() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          title: "Error fetching vehicles",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      return data as Vehicle[];
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">Manage your fleet vehicles</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Car className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8 text-destructive">
            Failed to load vehicles
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Make & Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Insurance Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles?.map((vehicle) => (
                <TableRow key={vehicle.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{vehicle.id.slice(0, 8)}</TableCell>
                  <TableCell className="capitalize">{vehicle.type.replace('_', ' ')}</TableCell>
                  <TableCell>{`${vehicle.make} ${vehicle.model}`}</TableCell>
                  <TableCell className="capitalize">{vehicle.status.replace('_', ' ')}</TableCell>
                  <TableCell>{vehicle.registration}</TableCell>
                  <TableCell>
                    {vehicle.insurance_expiry 
                      ? new Date(vehicle.insurance_expiry).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <VehicleFormDialog 
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
