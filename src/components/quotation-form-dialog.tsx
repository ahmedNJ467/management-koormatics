import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash, Calculator, Save, X, Info } from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Quotation, QuotationStatus, Client } from "@/lib/types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays } from "date-fns";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { formatCurrency } from "@/lib/invoice-helpers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Enhanced quotation form schema with better validation
const quotationSchema = z
  .object({
    client_id: z
      .string({ required_error: "Please select a client" })
      .min(1, "Client is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    notes: z.string().optional(),
    status: z.enum(["draft", "sent", "approved", "rejected", "expired"]),
    items: z
      .array(
        z.object({
          description: z
            .string()
            .min(1, "Description is required")
            .max(200, "Description too long"),
          quantity: z
            .number()
            .min(1, "Quantity must be at least 1")
            .max(9999, "Quantity too large"),
          unit_price: z
            .number()
            .min(0, "Price must be 0 or higher")
            .max(999999, "Price too large"),
          amount: z.number(),
        })
      )
      .min(1, "At least one item is required")
      .max(50, "Too many items (max 50)"),
    vat_percentage: z.number().min(0).max(100).optional(),
    discount_percentage: z.number().min(0).max(100).optional(),
  })
  .refine(
    (data) => {
      const validUntilDate = new Date(data.valid_until);
      const dateCreated = new Date(data.date);
      return validUntilDate >= dateCreated;
    },
    {
      message: "Valid until date must be after or equal to the quotation date",
      path: ["valid_until"],
    }
  );

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
  clients,
}: QuotationFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Set default dates for new quotations
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysFromNow = format(addDays(new Date(), 30), "yyyy-MM-dd");

  // Initialize the form with enhanced defaults
  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: quotation
      ? {
          client_id: quotation.client_id,
          date: quotation.date,
          valid_until: quotation.valid_until,
          notes: quotation.notes || "",
          status: quotation.status,
          items:
            quotation.items.length > 0
              ? quotation.items
              : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
          vat_percentage: quotation.vat_percentage || undefined,
          discount_percentage: quotation.discount_percentage || undefined,
        }
      : {
          client_id: "",
          date: today,
          valid_until: thirtyDaysFromNow,
          notes: "",
          status: "draft",
          items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
          vat_percentage: undefined,
          discount_percentage: undefined,
        },
  });

  // Setup field array for quotation items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Find selected client details
  useEffect(() => {
    const clientId = form.watch("client_id");
    if (clientId && clients) {
      const client = clients.find((c) => c.id === clientId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [form.watch("client_id"), clients]);

  // Reset form when quotation changes or dialog opens
  useEffect(() => {
    if (open) {
      if (quotation) {
        form.reset({
          client_id: quotation.client_id,
          date: quotation.date,
          valid_until: quotation.valid_until,
          notes: quotation.notes || "",
          status: quotation.status,
          items:
            quotation.items.length > 0
              ? quotation.items
              : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
          vat_percentage: quotation.vat_percentage || undefined,
          discount_percentage: quotation.discount_percentage || undefined,
        });
        setVatEnabled(
          !!quotation.vat_percentage && quotation.vat_percentage > 0
        );
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
          discount_percentage: undefined,
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

  // Calculate totals with enhanced calculations
  const watchedItems = form.watch("items");
  const subtotal = watchedItems.reduce(
    (total, item) => total + (item.amount || 0),
    0
  );
  const vatAmount = vatEnabled ? subtotal * 0.05 : 0;
  const discountAmountValue = subtotal * ((discountPercentage || 0) / 100);
  const grandTotal = subtotal + vatAmount - discountAmountValue;

  // Add a new item with smart defaults
  const handleAddItem = () => {
    append({
      description: "",
      quantity: 1,
      unit_price: 0,
      amount: 0,
    });
  };

  // Remove item with confirmation for multiple items
  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Auto-calculate valid until date when date changes
  const handleDateChange = (date: string) => {
    const newDate = new Date(date);
    const validUntil = format(addDays(newDate, 30), "yyyy-MM-dd");
    form.setValue("valid_until", validUntil);
  };

  // Submit form with enhanced error handling
  const onSubmit = async (values: QuotationFormValues) => {
    setIsSubmitting(true);

    try {
      // Validate that all items have valid amounts
      const hasInvalidItems = values.items.some(
        (item) => !item.description.trim() || item.quantity <= 0
      );
      if (hasInvalidItems) {
        throw new Error(
          "Please ensure all items have descriptions and valid quantities."
        );
      }

      const totalAmount = grandTotal;

      // Format the data for Supabase
      const formattedValues = {
        client_id: values.client_id,
        date: values.date,
        valid_until: values.valid_until,
        status: values.status,
        notes: values.notes?.trim() || null,
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
          description: "The quotation has been updated successfully.",
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
          description: "A new quotation has been created successfully.",
        });
      }

      // Close the dialog and refresh data
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    } catch (error) {
      console.error("Error saving quotation:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save quotation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: QuotationStatus) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "expired":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {quotation ? "Edit Quotation" : "Create New Quotation"}
              </DialogTitle>
              {quotation && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={getStatusBadgeColor(quotation.status)}
                  >
                    {quotation.status.charAt(0).toUpperCase() +
                      quotation.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ID: {quotation.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>
                  Set up the fundamental details for this quotation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client *</FormLabel>
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
                                <div className="flex items-center justify-between w-full">
                                  <span>{client.name}</span>
                                  {client.email && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {client.email}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedClient && (
                          <FormDescription>
                            {selectedClient.email &&
                              `Email: ${selectedClient.email}`}
                          </FormDescription>
                        )}
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
                            <SelectItem value="draft">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                Draft
                              </div>
                            </SelectItem>
                            <SelectItem value="sent">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                Sent
                              </div>
                            </SelectItem>
                            <SelectItem value="approved">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                Approved
                              </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                Rejected
                              </div>
                            </SelectItem>
                            <SelectItem value="expired">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                Expired
                              </div>
                            </SelectItem>
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
                        <FormLabel>Quotation Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleDateChange(e.target.value);
                            }}
                          />
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
                        <FormLabel>Valid Until *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Automatically set to 30 days from quotation date
                        </FormDescription>
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
                      <FormLabel>Notes & Terms</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes, terms, or conditions..."
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        These notes will appear on the quotation document
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Items Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Quotation Items</CardTitle>
                    <CardDescription>
                      Add items and services for this quotation
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    disabled={fields.length >= 50}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length >= 50 && (
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Maximum of 50 items allowed per quotation.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="relative">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-12 gap-4 items-start">
                          <div className="col-span-12 md:col-span-5">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">
                                    Description *
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="Describe the item or service..."
                                      className="resize-none min-h-[60px]"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="col-span-4 md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">
                                    Quantity *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={9999}
                                      {...field}
                                      onChange={(e) => {
                                        const value = parseInt(
                                          e.target.value || "1"
                                        );
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

                          <div className="col-span-4 md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unit_price`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">
                                    Unit Price ($) *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min={0}
                                      max={999999}
                                      {...field}
                                      onChange={(e) => {
                                        const value = parseFloat(
                                          e.target.value || "0"
                                        );
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

                          <div className="col-span-3 md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">
                                    Amount
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="text"
                                        value={formatCurrency(field.value)}
                                        disabled
                                        className="bg-muted font-medium"
                                      />
                                      <Calculator className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="col-span-1 flex justify-end pt-8">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              disabled={fields.length <= 1}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Totals Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing & Totals</CardTitle>
                <CardDescription>
                  Configure VAT, discounts, and review totals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vat"
                        checked={vatEnabled}
                        onCheckedChange={(checked) =>
                          setVatEnabled(checked as boolean)
                        }
                      />
                      <Label htmlFor="vat" className="text-sm font-medium">
                        Apply VAT (5%)
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount" className="text-sm font-medium">
                        Discount Percentage
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="discount"
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={discountPercentage || ""}
                          onChange={(e) =>
                            setDiscountPercentage(
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24"
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-80">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span className="font-medium">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>

                        {vatEnabled && (
                          <div className="flex justify-between text-sm text-blue-600">
                            <span>VAT (5%):</span>
                            <span className="font-medium">
                              +{formatCurrency(vatAmount)}
                            </span>
                          </div>
                        )}

                        {discountPercentage > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount ({discountPercentage}%):</span>
                            <span className="font-medium">
                              -{formatCurrency(discountAmountValue)}
                            </span>
                          </div>
                        )}

                        <Separator />

                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-primary">
                            {formatCurrency(grandTotal)}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {watchedItems.length} item
                          {watchedItems.length !== 1 ? "s" : ""}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || grandTotal <= 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {quotation ? "Update Quotation" : "Create Quotation"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
