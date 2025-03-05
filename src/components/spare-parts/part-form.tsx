
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { PartFormSchema } from "./schemas/spare-part-schema";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const imageInputRef = form.register("part_image");
  const compatibilities = form.watch("compatibility") || [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleFormSubmit = (data: z.infer<typeof PartFormSchema>) => {
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

  // Fixed: Fetching existing image preview using useEffect
  useEffect(() => {
    const fetchImage = async () => {
      if (existingImage) {
        try {
          const { data } = await supabase.storage
            .from("images")
            .getPublicUrl(existingImage);
          
          if (data) {
            setPreviewUrl(data.publicUrl);
          }
        } catch (error) {
          console.error("Error fetching image:", error);
        }
      }
    };
    
    fetchImage();
  }, [existingImage]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <ScrollArea className="max-h-[60vh] pr-3 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-1">
            <div className="space-y-4 md:col-span-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter part name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="part_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter part number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter manufacturer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter storage location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="Enter quantity" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="min_stock_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Stock Level</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="Enter minimum stock level" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="unit_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      placeholder="Enter unit price" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="md:col-span-2">
              <FormLabel htmlFor="part_image">Part Image</FormLabel>
              <div className="mt-1.5 flex items-start gap-4">
                <Input
                  id="part_image"
                  type="file"
                  onChange={(e) => {
                    imageInputRef.onChange(e);
                    handleImageChange(e);
                  }}
                  ref={imageInputRef.ref}
                  onBlur={imageInputRef.onBlur}
                  name={imageInputRef.name}
                  accept="image/*"
                  className="flex-1"
                />
                
                {previewUrl && (
                  <div className="relative h-24 w-24 rounded-md overflow-hidden border">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="h-full w-full object-cover" 
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6 rounded-full translate-x-1/3 -translate-y-1/3"
                      onClick={() => {
                        setPreviewUrl(null);
                        form.resetField("part_image");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
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
            
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional information about this part"
                        {...field}
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex justify-between sm:justify-end gap-2 pt-4 mt-6 border-t">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? "Saving..." : defaultValues ? "Update Part" : "Save Part"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
