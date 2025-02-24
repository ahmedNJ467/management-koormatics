
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { VehicleTypeField } from "./vehicle-form/vehicle-type-field";
import { VehicleBasicInfoFields } from "./vehicle-form/vehicle-basic-info-fields";
import { VehicleDetailsFields } from "./vehicle-form/vehicle-details-fields";
import { VehicleStatusField } from "./vehicle-form/vehicle-status-field";
import { VehicleNotesField } from "./vehicle-form/vehicle-notes-field";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleFormDialog({ open, onOpenChange }: VehicleFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>({
    defaultValues: {
      type: 'soft_skin',
      make: '',
      model: '',
      registration: '',
      status: 'active',
      year: undefined,
      color: '',
      vin: '',
      insurance_expiry: undefined,
      notes: '',
    },
  });

  async function onSubmit(data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('vehicles')
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vehicle added successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add vehicle",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>
            Add a new vehicle to your fleet. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <VehicleTypeField form={form} />
            <VehicleBasicInfoFields form={form} />
            <VehicleDetailsFields form={form} />
            <VehicleStatusField form={form} />
            <VehicleNotesField form={form} />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Vehicle"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
