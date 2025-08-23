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
import { VehicleFuelTypeField } from "./vehicle-fuel-type-field";
import { Separator } from "@/components/ui/separator";

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSubmit: (
    data: Omit<Vehicle, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  images: File[];
  setImages: (files: File[]) => void;
  imagePreviewUrls: string[];
  setImagePreviewUrls: (urls: string[]) => void;
}

export function VehicleForm({
  vehicle,
  onSubmit,
  onCancel,
  isSubmitting,
  images,
  setImages,
  imagePreviewUrls,
  setImagePreviewUrls,
}: VehicleFormProps) {
  const form = useForm<Omit<Vehicle, "id" | "created_at" | "updated_at">>({
    defaultValues: {
      type: vehicle?.type || "soft_skin",
      make: vehicle?.make || "",
      model: vehicle?.model || "",
      registration: vehicle?.registration || "",
      status: vehicle?.status || "active",
      fuel_type: vehicle?.fuel_type || "petrol",
      year: vehicle?.year,
      color: vehicle?.color || "",
      vin: vehicle?.vin || "",
      insurance_expiry: vehicle?.insurance_expiry
        ? new Date(vehicle.insurance_expiry).toISOString().split("T")[0]
        : undefined,
      notes: vehicle?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Images Section */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Vehicle Images</h3>
          <VehicleImagesField
            vehicle={vehicle}
            images={images}
            setImages={setImages}
            imagePreviewUrls={imagePreviewUrls}
            setImagePreviewUrls={setImagePreviewUrls}
          />
        </div>
        
        {/* Basic Info Section */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VehicleTypeField form={form} />
            <VehicleFuelTypeField form={form} />
            <VehicleBasicInfoFields form={form} />
          </div>
        </div>
        
        {/* Details Section */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Vehicle Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VehicleDetailsFields form={form} />
          </div>
        </div>
        
        {/* Status & Notes Section */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Status & Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VehicleStatusField form={form} />
            <VehicleNotesField form={form} />
          </div>
        </div>
        
        <VehicleFormActions
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          isEdit={!!vehicle}
        />
      </form>
    </Form>
  );
}
