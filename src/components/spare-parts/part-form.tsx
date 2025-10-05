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
  existingImage,
}: PartFormProps) => {
  const { previewUrl, setPreviewUrl, handleImageChange } =
    useImagePreview(existingImage);

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
      purchase_date: defaultValues?.purchase_date || "",
      compatibility: defaultValues?.compatibility || [],
      notes: defaultValues?.notes || "",
    },
  });

  const handleFormSubmit = (data: z.infer<typeof PartFormSchema>) => {
    onSubmit(data);
  };

  useEffect(() => {
    if (existingImage) {
      form.setValue("part_image", undefined);
    }
  }, [existingImage, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col h-full min-h-0"
      >
        <ScrollArea className="flex-1 h-full pr-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
            <div className="space-y-6">
              <BasicDetails form={form} />
              <InventoryDetails form={form} />
              <CompatibilitySection form={form} />
              <NotesSection form={form} />
            </div>

            <div className="space-y-6">
              <ImageUpload
                imageInputRef={form.register("part_image")}
                existingImage={existingImage}
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
                handleImageChange={handleImageChange}
                form={form}
              />
            </div>
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
