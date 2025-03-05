
import { useState } from "react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { PartFormSchema } from "../schemas/spare-part-schema";

interface CompatibilitySectionProps {
  form: UseFormReturn<z.infer<typeof PartFormSchema>>;
}

export const CompatibilitySection = ({ form }: CompatibilitySectionProps) => {
  const [compatibilityInput, setCompatibilityInput] = useState("");
  const compatibilities = form.watch("compatibility") || [];

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

  return (
    <div className="md:col-span-2">
      <FormLabel>Compatible With</FormLabel>
      <div className="flex gap-2 mb-2">
        <Input
          placeholder="Add compatibility"
          value={compatibilityInput}
          onChange={(e) => setCompatibilityInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCompatibility();
            }
          }}
        />
        <Button 
          type="button" 
          onClick={addCompatibility} 
          variant="outline"
          className="flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2">
        {compatibilities.map((item, index) => (
          <div 
            key={index} 
            className="bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 px-2.5 py-1 rounded-full text-sm flex items-center gap-1.5 border border-purple-200 dark:border-purple-800/30"
          >
            {item}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 rounded-full"
              onClick={() => removeCompatibility(item)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {compatibilities.length === 0 && (
          <span className="text-sm text-muted-foreground italic">No compatibility information added</span>
        )}
      </div>
    </div>
  );
};
