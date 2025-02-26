
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
import { ImagePlus, X } from "lucide-react";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
}

export function VehicleFormDialog({ open, onOpenChange, vehicle }: VehicleFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

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

  useEffect(() => {
    if (vehicle?.vehicle_images) {
      setImagePreviewUrls(vehicle.vehicle_images.map(img => img.image_url));
    } else {
      setImagePreviewUrls([]);
    }
    setImages([]);
  }, [vehicle]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImages(prev => [...prev, ...files]);
    
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) {
    try {
      setIsSubmitting(true);

      if (vehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(data)
          .eq('id', vehicle.id);

        if (error) throw error;

        if (images.length > 0) {
          for (const file of images) {
            const fileExt = file.name.split('.').pop();
            const filePath = `${vehicle.id}/${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('vehicle-images')
              .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('vehicle-images')
              .getPublicUrl(filePath);

            const { error: insertError } = await supabase
              .from('vehicle_images')
              .insert([{
                vehicle_id: vehicle.id,
                image_url: publicUrl
              }]);

            if (insertError) throw insertError;
          }
        }
      } else {
        const { data: newVehicle, error } = await supabase
          .from('vehicles')
          .insert([data])
          .select()
          .single();

        if (error) throw error;

        if (images.length > 0 && newVehicle) {
          for (const file of images) {
            const fileExt = file.name.split('.').pop();
            const filePath = `${newVehicle.id}/${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('vehicle-images')
              .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('vehicle-images')
              .getPublicUrl(filePath);

            const { error: insertError } = await supabase
              .from('vehicle_images')
              .insert([{
                vehicle_id: newVehicle.id,
                image_url: publicUrl
              }]);

            if (insertError) throw insertError;
          }
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
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <label className="block text-sm font-medium">Vehicle Images</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Vehicle ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                <label className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mt-2">Add Images</span>
                  </div>
                </label>
              </div>
            </div>

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
