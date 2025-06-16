
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Quotation, QuotationStatus, Client } from "@/lib/types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays } from "date-fns";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { formatCurrency } from "@/lib/invoice-helpers";

// Updated quotation form schema
const quotationSchema = z.object({
  client_id: z.string({ required_error: "Please select a client" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "approved", "rejected", "expired"]),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unit_price: z.number().min(0, "Price must be 0 or higher"),
      amount: z.number()
    })
  ).min(1, "At least one item is required"),
  vat_percentage: z.number().optional(),
  discount_percentage: z.number().optional()
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

interface QuotationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  clients: Client[];
}

export function QuotationFormDialog({
  open,
  onOpenChange,
  quotation,
  clients
}: QuotationFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  
  // Set default dates for new quotations
  const today = format(new Date(), 'yyyy-MM-dd');
  const thirtyDaysFromNow = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  // Initialize the form
  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: quotation ? {
      client_id: quotation.client_id,
      date: quotation.date,
      valid_until: quotation.valid_until,
      notes: quotation.notes || "",
      status: quotation.status,
      items: quotation.items,
      vat_percentage: quotation.vat_percentage || undefined,
      discount_percentage: quotation.discount_percentage || undefined
    } : {
      client_id: "",
      date: today,
      valid_until: thirtyDaysFromNow,
      notes: "",
      status: "draft",
      items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
      vat_percentage: undefined,
      discount_percentage: undefined
    }
  });

  // Setup field array for quotation items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Reset form when quotation changes
  useEffect(() => {
    if (open) {
      if (quotation) {
        form.reset({
          client_id: quotation.client_id,
          date: quotation.date,
          valid_until: quotation.valid_until,
          notes: quotation.notes || "",
          status: quotation.status,
          items: quotation.items,
          vat_percentage: quotation.vat_percentage || undefined,
          discount_percentage: quotation.discount_percentage || undefined
        });
        setVatEnabled(!!quotation.vat_percentage && quotation.vat_percentage > 0);
        setDiscountPercentage(quotation.discount_percentage || 0);
      } else {
        form.reset({
          client_id: "",
          date: today,
          valid_until: thirtyDaysFromNow,
          notes: "",
          status: "draft",
          items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
          vat_percentage: undefined,
          discount_percentage: undefined
        });
        setVatEnabled(false);
        setDiscountPercentage(0);
      }
    }
  }, [open, quotation, form, today, thirtyDaysFromNow]);

  // Calculate item amount when quantity or unit price changes
  const calculateItemAmount = (index: number) => {
    const items = form.getValues("items");
    const quantity = items[index].quantity || 0;
    const unitPrice = items[index].unit_price || 0;
    const amount = quantity * unitPrice;
    form.setValue(`items.${index}.amount`, amount);
    return amount;
  };

  // Calculate total amount
  const watchedItems = form.watch("items");
  const subtotal = watchedItems.reduce((total, item) => total + (item.amount || 0), 0);
  const vatAmount = vatEnabled ? subtotal * 0.05 : 0;
  const discountAmountValue = subtotal * ((discountPercentage || 0) / 100);
  const grandTotal = subtotal + vatAmount - discountAmountValue;

  // Add a new item
  const handleAddItem = () => {
    append({
      description: "",
      quantity: 1,
      unit_price: 0,
      amount: 0
    });
  };

  // Submit form
  const onSubmit = async (values: QuotationFormValues) => {
    setIsSubmitting(true);
    
    try {
      const totalAmount = grandTotal;
      
      // Format the data for Supabase
      const formattedValues = {
        client_id: values.client_id,
        date: values.date,
        valid_until: values.valid_until,
        status: values.status,
        notes: values.notes || null,
        total_amount: totalAmount,
        items: values.items as any, // Cast to any to handle the JSON type
        vat_percentage: vatEnabled ? 5 : null,
        discount_percentage: discountPercentage > 0 ? discountPercentage : null,
      };

      console.log("Submitting quotation with data:", formattedValues);
      
      if (quotation) {
        // Update existing quotation
        const { error } = await supabase
          .from("quotations")
          .update(formattedValues)
          .eq("id", quotation.id);
          
        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        
        toast({
          title: "Quotation updated",
          description: "The quotation has been updated successfully."
        });
      } else {
        // Insert new quotation
        const { error } = await supabase
          .from("quotations")
          .insert(formattedValues);
          
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        
        toast({
          title: "Quotation created",
          description: "A new quotation has been created successfully."
        });
      }
      
      // Close the dialog and refresh data
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      
    } catch (error) {
      console.error("Error saving quotation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save quotation",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quotation ? "Edit Quotation" : "Create New Quotation"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes or terms..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Items</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start border p-3 rounded-md">
                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Description</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1}
                                {...field}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value || "0");
                                  field.onChange(value || 1);
                                  calculateItemAmount(index);
                                }}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Unit Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min={0}
                                {...field}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value || "0");
                                  field.onChange(value || 0);
                                  calculateItemAmount(index);
                                }}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Amount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                value={field.value.toFixed(2)}
                                disabled 
                                className="bg-muted"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-1 pt-8">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fields.length > 1 && remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-4 mt-4">
                <div className="w-[280px] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="vat" checked={vatEnabled} onCheckedChange={(c) => setVatEnabled(c as boolean)} />
                      <Label htmlFor="vat">VAT (5%)</Label>
                    </div>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <Label htmlFor="discount">Discount (%):</Label>
                    <Input id="discount" type="number" value={discountPercentage || ""} onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)} className="h-8 text-right w-24" />
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t mt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Quotation</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
