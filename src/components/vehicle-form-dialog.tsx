
import { useState, useEffect } from "react";
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
import { VehicleImagesField } from "./vehicle-form/vehicle-images-field";
import { useVehicleImages } from "./vehicle-form/use-vehicle-images";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
}

export function VehicleFormDialog({ open, onOpenChange, vehicle }: VehicleFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { 
    images, 
    setImages, 
    imagePreviewUrls, 
    setImagePreviewUrls, 
    uploadVehicleImages 
  } = useVehicleImages();

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

  // Set form values when vehicle prop changes
  useEffect(() => {
    if (vehicle) {
      form.reset({
        type: vehicle.type,
        make: vehicle.make,
        model: vehicle.model,
        registration: vehicle.registration,
        status: vehicle.status,
        year: vehicle.year,
        color: vehicle.color || '',
        vin: vehicle.vin || '',
        insurance_expiry: vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toISOString().split('T')[0] : undefined,
        notes: vehicle.notes || '',
      });
    } else {
      form.reset({
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
      });
    }
  }, [vehicle, form]);

  async function onSubmit(data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
    try {
      setIsSubmitting(true);

      if (vehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(data)
          .eq('id', vehicle.id);

        if (error) throw error;
        await uploadVehicleImages(vehicle.id);
      } else {
        const { data: newVehicle, error } = await supabase
          .from('vehicles')
          .insert([data])
          .select()
          .single();

        if (error) throw error;
        if (newVehicle) {
          await uploadVehicleImages(newVehicle.id);
        }
      }

      toast({
        title: "Success",
        description: `Vehicle ${vehicle ? 'updated' : 'added'} successfully`,
      });

      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save vehicle",
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
          <DialogTitle>{vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
          <DialogDescription>
            {vehicle ? 'Update the details of your vehicle below.' : 'Fill in the details of your new vehicle below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <VehicleImagesField
              vehicle={vehicle}
              images={images}
              setImages={setImages}
              imagePreviewUrls={imagePreviewUrls}
              setImagePreviewUrls={setImagePreviewUrls}
            />

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
                {isSubmitting ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
