
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PartFormSchema } from "../schemas/spare-part-schema";

interface UsePartFormProps {
  defaultValues?: Partial<z.infer<typeof PartFormSchema>>;
  onSubmit: (data: z.infer<typeof PartFormSchema>) => void;
}

export const usePartForm = ({ defaultValues, onSubmit }: UsePartFormProps) => {
  const [compatibilityInput, setCompatibilityInput] = useState("");
  
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

  const handleSubmit = (data: z.infer<typeof PartFormSchema>) => {
    console.log("Form submitted with data:", data);
    onSubmit(data);
  };

  const addCompatibility = () => {
    if (!compatibilityInput.trim()) return;
    
    const currentCompatibilities = form.getValues("compatibility") || [];
    if (!currentCompatibilities.includes(compatibilityInput.trim())) {
      form.setValue("compatibility", [...currentCompatibilities, compatibilityInput.trim()]);
    }
    setCompatibilityInput("");
  };

  const removeCompatibility = (item: string) => {
    const currentCompatibilities = form.getValues("compatibility") || [];
    form.setValue(
      "compatibility", 
      currentCompatibilities.filter(c => c !== item)
    );
  };

  return {
    form,
    compatibilityInput,
    setCompatibilityInput,
    handleSubmit: form.handleSubmit(handleSubmit),
    addCompatibility,
    removeCompatibility
  };
};
