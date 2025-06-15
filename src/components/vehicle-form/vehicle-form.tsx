
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Vehicle } from "@/lib/types";
import { VehicleTypeField } from "./vehicle-type-field";
import { VehicleBasicInfoFields } from "./vehicle-basic-info-fields";
import { VehicleDetailsFields } from "./vehicle-details-fields";
import { VehicleStatusField } from "./vehicle-status-field";
import { VehicleNotesField } from "./vehicle-notes-field";
import { VehicleImagesField } from "./vehicle-images-field";
import { VehicleFormActions } from "./vehicle-form-actions";
import { useVehicleImages } from "./use-vehicle-images";

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSubmit: (data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function VehicleForm({ vehicle, onSubmit, onCancel, isSubmitting }: VehicleFormProps) {
  const { 
    images, 
    setImages, 
    imagePreviewUrls, 
    setImagePreviewUrls 
  } = useVehicleImages();

  const form = useForm<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>({
    defaultValues: {
      type: vehicle?.type || 'soft_skin',
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      registration: vehicle?.registration || '',
      status: vehicle?.status || 'active',
      year: vehicle?.year,
      color: vehicle?.color || '',
      vin: vehicle?.vin || '',
      insurance_expiry: vehicle?.insurance_expiry ? new Date(vehicle.insurance_expiry).toISOString().split('T')[0] : undefined,
      notes: vehicle?.notes || '',
    },
  });

  return (
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

        <VehicleFormActions
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          isEdit={!!vehicle}
        />
      </form>
    </Form>
  );
}
