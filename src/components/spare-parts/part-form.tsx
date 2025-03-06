
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PartFormSchema } from "./schemas/spare-part-schema";
import { BasicDetails } from "./form-components/basic-details";
import { InventoryDetails } from "./form-components/inventory-details";
import { ImageUpload } from "./form-components/image-upload";
import { CompatibilitySection } from "./form-components/compatibility-section";
import { NotesSection } from "./form-components/notes-section";
import { FormActions } from "./form-components/form-header";
import { useImagePreview } from "./form-components/use-image-preview";
import { useEffect } from "react";

interface PartFormProps {
  onSubmit: (data: z.infer<typeof PartFormSchema>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  defaultValues?: Partial<z.infer<typeof PartFormSchema>>;
  existingImage?: string;
}

export const PartForm = ({
  onSubmit,
  onCancel,
  isSubmitting,
  defaultValues,
  existingImage
}: PartFormProps) => {
  const { previewUrl, setPreviewUrl, handleImageChange } = useImagePreview(existingImage);
  
  const form = useForm<z.infer<typeof PartFormSchema>>({
    resolver: zodResolver(PartFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      part_number: defaultValues?.part_number || "",
      category: defaultValues?.category || "",
      manufacturer: defaultValues?.manufacturer || "",
      quantity: defaultValues?.quantity || 0,
      unit_price: defaultValues?.unit_price || 0,
      location: defaultValues?.location || "",
      min_stock_level: defaultValues?.min_stock_level || 5,
      compatibility: defaultValues?.compatibility || [],
      notes: defaultValues?.notes || ""
    }
  });

  const handleFormSubmit = (data: z.infer<typeof PartFormSchema>) => {
    console.log("Form submitted with data:", data);
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <ScrollArea className="max-h-[60vh] pr-3 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-1">
            <BasicDetails form={form} />
            
            <InventoryDetails form={form} />
            
            <ImageUpload 
              imageInputRef={form.register("part_image")}
              existingImage={existingImage}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
              handleImageChange={handleImageChange}
              form={form}
            />
            
            <CompatibilitySection form={form} />
            
            <NotesSection form={form} />
          </div>
        </ScrollArea>
        
        <FormActions 
          onCancel={onCancel} 
          isSubmitting={isSubmitting} 
          defaultValues={defaultValues}
        />
      </form>
    </Form>
  );
};
