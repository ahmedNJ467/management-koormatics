
import { useState } from "react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { format, isValid, parseISO } from "date-fns";

export default function FuelLogs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedFuelLog, setSelectedFuelLog] = useState<FuelLog | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: fuelLogs, isLoading } = useQuery({
    queryKey: ['fuel-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select(`
          *,
          vehicle:vehicles (
            make,
            model,
            registration
          )
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as FuelLog[];
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fuel_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Fuel Logs</h2>
          <p className="text-muted-foreground">Track fuel consumption and costs</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Log
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Fuel Type</TableHead>
              <TableHead>Volume (L)</TableHead>
              <TableHead>Cost (USD)</TableHead>
              <TableHead>Current Mileage (km)</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : fuelLogs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No fuel logs found. Add your first one!
                </TableCell>
              </TableRow>
            ) : (
              fuelLogs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateCell(log.date)}</TableCell>
                  <TableCell>
                    {log.vehicle ? `${log.vehicle.make} ${log.vehicle.model}` : "Unknown Vehicle"}
                  </TableCell>
                  <TableCell className="capitalize">{log.fuel_type}</TableCell>
                  <TableCell>{log.volume.toFixed(1)}</TableCell>
                  <TableCell>${log.cost.toFixed(2)}</TableCell>
                  <TableCell>{log.current_mileage?.toLocaleString() || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFuelLog(log);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFuelLog(log);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <FuelLogFormDialog 
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedFuelLog(null);
        }}
        fuelLog={selectedFuelLog || undefined}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fuel Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fuel log? This action cannot be undone.
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
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
