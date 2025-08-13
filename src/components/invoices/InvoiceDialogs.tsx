import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isBefore, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Trash,
  CreditCard,
  Download,
  Send,
  DollarSign,
  Check,
  Calendar,
  Users,
  RefreshCw,
  AlertCircle,
  Calculator,
  Clock,
  FileText,
  Info,
  Receipt,
  Save,
  Settings,
} from "lucide-react";
import {
  DisplayInvoice,
  InvoiceItem,
  PaymentMethod,
  InvoiceStatus,
} from "@/lib/types/invoice";
import { Client } from "@/lib/types/client";
import { DisplayTrip } from "@/lib/types/trip";
import { supabase } from "@/integrations/supabase/client";
import { useInvoiceMutations } from "./hooks/useInvoiceMutations";
import {
  calculateTotal,
  formatCurrency,
  formatDate,
  formatStatus,
  getStatusColor,
  generateInvoicePDF,
  sendInvoiceByEmail,
} from "@/lib/invoice-helpers";
import { DatePicker } from "@/components/ui/date-picker";

// Enhanced validation schema
const invoiceFormSchema = z
  .object({
    client_id: z.string().min(1, "Please select a client"),
    date: z.string().min(1, "Invoice date is required"),
    due_date: z.string().min(1, "Due date is required"),
    status: z
      .enum(["draft", "sent", "paid", "overdue", "cancelled"])
      .optional(),
    notes: z.string().optional(),
    payment_terms: z.string().optional(),
    reference_number: z.string().optional(),
  })
  .refine(
    (data) => {
      const invoiceDate = parseISO(data.date);
      const dueDate = parseISO(data.due_date);
      return !isBefore(dueDate, invoiceDate);
    },
    {
      message: "Due date must be after invoice date",
      path: ["due_date"],
    }
  );

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

// Form Dialog Component
interface InvoiceFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editInvoice: DisplayInvoice | null;
  clients: Client[] | undefined;
}

export function InvoiceFormDialog({
  isOpen,
  onOpenChange,
  editInvoice,
  clients,
}: InvoiceFormDialogProps) {
  const { saveInvoice, isSaving } = useInvoiceMutations();
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState(5);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [currency, setCurrency] = useState("USD");
  const [paymentTerms, setPaymentTerms] = useState<string>("net_30");

  // Initialize form with react-hook-form
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      status: "draft",
      notes: "",
      payment_terms: "net_30",
      reference_number: "",
    },
  });

  const selectedClientId = form.watch("client_id");

  const { data: availableTrips } = useQuery({
    queryKey: ["availableTrips", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const { data, error } = await supabase
        .from("trips")
        .select(
          `id, date, pickup_location, dropoff_location, service_type, vehicle_type, soft_skin_count, armoured_count, has_security_escort, escort_count, amount`
        )
        .eq("client_id", selectedClientId)
        .is("invoice_id", null);
      if (error) throw error;
      return data.map(
        (trip: any) =>
          ({ ...trip, type: trip.service_type || "other" } as DisplayTrip)
      );
    },
    enabled: !!selectedClientId,
  });

  const selectedClient = clients?.find((c) => c.id === selectedClientId);

  // Payment terms options
  const paymentTermsOptions = [
    { value: "due_on_receipt", label: "Due on Receipt" },
    { value: "net_15", label: "Net 15 Days" },
    { value: "net_30", label: "Net 30 Days" },
    { value: "net_45", label: "Net 45 Days" },
    { value: "net_60", label: "Net 60 Days" },
    { value: "custom", label: "Custom Terms" },
  ];

  // Currency options
  const currencyOptions = [
    { value: "USD", label: "USD ($)", symbol: "$" },
    { value: "EUR", label: "EUR (€)", symbol: "€" },
    { value: "GBP", label: "GBP (£)", symbol: "£" },
    { value: "SOS", label: "SOS (Sh)", symbol: "Sh" },
  ];

  // Initialize form when editing
  useEffect(() => {
    if (editInvoice && isOpen) {
      form.reset({
        client_id: editInvoice.client_id,
        date: editInvoice.date,
        due_date: editInvoice.due_date,
        status: editInvoice.status,
        notes: editInvoice.notes || "",
        reference_number: editInvoice.id?.substring(0, 8).toUpperCase(),
      });
      setInvoiceItems(
        editInvoice.items.length > 0
          ? editInvoice.items
          : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }]
      );
      setVatEnabled(
        !!editInvoice.vat_percentage && editInvoice.vat_percentage > 0
      );
      setVatRate(editInvoice.vat_percentage || 5);
      setDiscountPercentage(editInvoice.discount_percentage || 0);
    } else if (!editInvoice && isOpen) {
      form.reset({
        client_id: "",
        date: format(new Date(), "yyyy-MM-dd"),
        due_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
        status: "draft",
        notes: "",
        reference_number: "",
      });
      setSelectedTrips([]);
      setInvoiceItems([
        { description: "", quantity: 1, unit_price: 0, amount: 0 },
      ]);
      setVatEnabled(false);
      setVatRate(5);
      setDiscountPercentage(0);
      setDiscountType("percentage");
      setCurrency("USD");
      setPaymentTerms("net_30");
    }
  }, [editInvoice, isOpen, form]);

  const updateInvoiceItem = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      const quantity = updatedItems[index].quantity;
      const unitPrice = updatedItems[index].unit_price;
      updatedItems[index].amount = quantity * unitPrice;
    }
    setInvoiceItems(updatedItems);
  };

  const addInvoiceItem = () =>
    setInvoiceItems([
      ...invoiceItems,
      { description: "", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1)
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Enhanced calculation functions
  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const validateInvoiceItems = () => {
    return invoiceItems.every(
      (item) =>
        item.description.trim() !== "" &&
        item.quantity > 0 &&
        item.unit_price >= 0
    );
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!validateInvoiceItems()) {
      form.setError("root", {
        message: "Please fill in all invoice items correctly",
      });
      return;
    }

    const subtotal = calculateTotal(invoiceItems);
    const vatAmount = vatEnabled ? subtotal * (vatRate / 100) : 0;
    const discountAmount =
      discountType === "percentage"
        ? subtotal * ((discountPercentage || 0) / 100)
        : discountPercentage || 0;
    const grandTotal = subtotal + vatAmount - discountAmount;

    const invoiceData = {
      client_id: data.client_id,
      date: data.date,
      due_date: data.due_date,
      status: data.status || "draft",
      items: invoiceItems,
      total_amount: grandTotal,
      paid_amount: editInvoice?.paid_amount || 0,
      notes: data.notes || undefined,
      vat_percentage: vatEnabled ? vatRate : undefined,
      discount_percentage:
        discountPercentage > 0 ? discountPercentage : undefined,
      ...(editInvoice
        ? { updated_at: new Date().toISOString() }
        : {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
    };

    try {
      await saveInvoice({ invoiceData, editInvoice, selectedTrips });
      onOpenChange(false);
    } catch (error) {
      form.setError("root", {
        message: "Failed to save invoice. Please try again.",
      });
    }
  };

  const subtotal = calculateTotal(invoiceItems);
  const vatAmount = vatEnabled ? subtotal * (vatRate / 100) : 0;
  const discountAmountValue =
    discountType === "percentage"
      ? subtotal * ((discountPercentage || 0) / 100)
      : discountPercentage || 0;
  const grandTotal = subtotal + vatAmount - discountAmountValue;

  const currencySymbol =
    currencyOptions.find((c) => c.value === currency)?.symbol || "$";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {editInvoice ? "Edit Invoice" : "Create New Invoice"}
          </DialogTitle>
          <DialogDescription>
            {editInvoice
              ? `Editing invoice for ${editInvoice.client_name}`
              : "Create a professional invoice for your client with detailed billing information"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <Form {...form}>
            <form
              id="invoice-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pt-4 pb-6"
            >
              {/* Display form errors */}
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {form.formState.errors.root.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Basic Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Invoice Information
                  </CardTitle>
                  <CardDescription>
                    Basic details about the invoice and client
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="client_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!!editInvoice}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clients?.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {client.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {client.email}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedClient && (
                        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
                          <div className="font-medium">
                            {selectedClient.name}
                          </div>
                          <div>{selectedClient.email}</div>
                          {selectedClient.phone && (
                            <div>{selectedClient.phone}</div>
                          )}
                          {selectedClient.address && (
                            <div>{selectedClient.address}</div>
                          )}
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="reference_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reference Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Optional reference number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Invoice Date *</FormLabel>
                              <FormControl>
                                <DatePicker
                                  {...field}
                                  {...({} as any)}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="due_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date *</FormLabel>
                              <FormControl>
                                <DatePicker
                                  {...field}
                                  {...({} as any)}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencyOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment_terms">Payment Terms</Label>
                          <Select
                            value={paymentTerms}
                            onValueChange={setPaymentTerms}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentTermsOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {editInvoice && (
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="sent">Sent</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="overdue">
                                    Overdue
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    Cancelled
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Trips Section */}
              {!editInvoice &&
                selectedClientId &&
                availableTrips &&
                availableTrips.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Available Trips
                      </CardTitle>
                      <CardDescription>
                        Select trips to include in this invoice (optional)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {availableTrips.map((trip) => (
                          <div
                            key={trip.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={`trip-${trip.id}`}
                              checked={selectedTrips.includes(trip.id)}
                              onCheckedChange={(checked) => {
                                const serviceLabel = (trip.service_type || "")
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l: string) =>
                                    l.toUpperCase()
                                  );
                                const vehicleBits: string[] = [];
                                if (trip.vehicle_type)
                                  vehicleBits.push(
                                    trip.vehicle_type === "armoured"
                                      ? "Armoured"
                                      : "Soft Skin"
                                  );
                                if (trip.soft_skin_count)
                                  vehicleBits.push(
                                    `Soft Skin: ${trip.soft_skin_count}`
                                  );
                                if (trip.armoured_count)
                                  vehicleBits.push(
                                    `Armoured: ${trip.armoured_count}`
                                  );
                                const vehicleInfo =
                                  vehicleBits.join(" | ") || "N/A";
                                const escortInfo = trip.has_security_escort
                                  ? `${
                                      trip.escort_count || 1
                                    } escort vehicle(s)`
                                  : "None";
                                const description = `Trip from ${
                                  trip.pickup_location || "N/A"
                                } to ${
                                  trip.dropoff_location || "N/A"
                                } on ${format(
                                  new Date(trip.date),
                                  "dd/MM/yyyy"
                                )} — Service: ${serviceLabel}; Vehicle: ${
                                  vehicleInfo || "N/A"
                                }; Escort: ${escortInfo} (Trip ID: ${String(
                                  trip.id
                                )
                                  .substring(0, 8)
                                  .toUpperCase()})`;
                                if (checked) {
                                  setSelectedTrips([...selectedTrips, trip.id]);
                                  setInvoiceItems((items) => [
                                    ...items.filter((i) => i.description),
                                    {
                                      description,
                                      quantity: 1,
                                      unit_price: trip.amount || 0,
                                      amount: trip.amount || 0,
                                    },
                                  ]);
                                } else {
                                  setSelectedTrips(
                                    selectedTrips.filter((id) => id !== trip.id)
                                  );
                                  const newItems = invoiceItems.filter(
                                    (item) => item.description !== description
                                  );
                                  setInvoiceItems(
                                    newItems.length > 0
                                      ? newItems
                                      : [
                                          {
                                            description: "",
                                            quantity: 1,
                                            unit_price: 0,
                                            amount: 0,
                                          },
                                        ]
                                  );
                                }
                              }}
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`trip-${trip.id}`}
                                className="cursor-pointer"
                              >
                                <div className="font-medium">
                                  {format(new Date(trip.date), "MMM d, yyyy")}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {trip.pickup_location} →{" "}
                                  {trip.dropoff_location}
                                </div>
                              </Label>
                            </div>
                            <div className="font-medium text-green-600">
                              {currencySymbol}
                              {trip.amount?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Invoice Items Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Invoice Items
                      </CardTitle>
                      <CardDescription>
                        Add items and services to be invoiced
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addInvoiceItem}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-3 text-sm font-medium text-muted-foreground px-3">
                      <div className="col-span-5">Description</div>
                      <div className="col-span-2">Quantity</div>
                      <div className="col-span-2">Unit Price</div>
                      <div className="col-span-2">Amount</div>
                      <div className="col-span-1">Action</div>
                    </div>

                    {/* Invoice Items */}
                    {invoiceItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-3 items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="col-span-5">
                          <Input
                            placeholder="Enter item description..."
                            value={item.description}
                            onChange={(e) =>
                              updateInvoiceItem(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            className="border-0 bg-transparent focus-visible:ring-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateInvoiceItem(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 1
                              )
                            }
                            min="1"
                            step="1"
                            className="border-0 bg-transparent focus-visible:ring-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                              {currencySymbol}
                            </span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateInvoiceItem(
                                  index,
                                  "unit_price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              min="0"
                              step="0.01"
                              className="border-0 bg-transparent focus-visible:ring-1 pl-8"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex h-10 items-center px-3 border rounded-md bg-muted/50 font-medium text-right">
                            {currencySymbol}
                            {item.amount.toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {invoiceItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeInvoiceItem(index)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Item Button for empty state */}
                    {invoiceItems.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground mb-4">
                          No items added yet
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addInvoiceItem}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add First Item
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Pricing & Totals Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Pricing & Totals
                  </CardTitle>
                  <CardDescription>
                    Configure taxes, discounts, and view invoice totals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Tax and Discount Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="vat"
                            checked={vatEnabled}
                            onCheckedChange={(checked) =>
                              setVatEnabled(checked as boolean)
                            }
                          />
                          <Label htmlFor="vat" className="text-sm font-medium">
                            Enable VAT/Tax
                          </Label>
                        </div>

                        {vatEnabled && (
                          <div className="space-y-2">
                            <Label htmlFor="vat_rate">Tax Rate (%)</Label>
                            <Input
                              id="vat_rate"
                              type="number"
                              value={vatRate}
                              onChange={(e) =>
                                setVatRate(parseFloat(e.target.value) || 0)
                              }
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="discount_type">Discount Type</Label>
                          <Select
                            value={discountType}
                            onValueChange={(value: "percentage" | "fixed") =>
                              setDiscountType(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">
                                Percentage (%)
                              </SelectItem>
                              <SelectItem value="fixed">
                                Fixed Amount ({currencySymbol})
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discount">
                            Discount{" "}
                            {discountType === "percentage"
                              ? "(%)"
                              : `(${currencySymbol})`}
                          </Label>
                          <Input
                            id="discount"
                            type="number"
                            value={discountPercentage || ""}
                            onChange={(e) =>
                              setDiscountPercentage(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            max={
                              discountType === "percentage" ? "100" : undefined
                            }
                            step={
                              discountType === "percentage" ? "0.1" : "0.01"
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Totals Summary */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span className="font-medium">
                            {currencySymbol}
                            {subtotal.toFixed(2)}
                          </span>
                        </div>

                        {vatEnabled && (
                          <div className="flex justify-between text-sm">
                            <span>Tax ({vatRate}%):</span>
                            <span className="font-medium">
                              {currencySymbol}
                              {vatAmount.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {discountPercentage > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>
                              Discount{" "}
                              {discountType === "percentage"
                                ? `(${discountPercentage}%)`
                                : ""}
                              :
                            </span>
                            <span className="font-medium text-red-600">
                              -{currencySymbol}
                              {discountAmountValue.toFixed(2)}
                            </span>
                          </div>
                        )}

                        <Separator />

                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-primary">
                            {currencySymbol}
                            {grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Notes & Terms Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Information
                  </CardTitle>
                  <CardDescription>
                    Add notes, terms, and payment instructions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Add any additional notes, terms and conditions, or payment instructions..."
                            rows={4}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Terms Display */}
                  {paymentTerms !== "custom" && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Payment Terms:</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        {
                          paymentTermsOptions.find(
                            (opt) => opt.value === paymentTerms
                          )?.label
                        }
                      </p>
                    </div>
                  )}

                  {/* Professional Template Suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentNotes = form.getValues("notes") || "";
                        const termsText =
                          "\n\nTerms & Conditions:\n• Payment is due within the specified payment terms\n• Late payments may incur additional fees\n• Please retain this invoice for your records";
                        form.setValue("notes", currentNotes + termsText);
                      }}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Terms & Conditions
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentNotes = form.getValues("notes") || "";
                        const paymentText =
                          "\n\nPayment Instructions:\n• Bank transfer details will be provided upon request\n• Please reference the invoice number in your payment\n• Contact us for any payment queries";
                        form.setValue("notes", currentNotes + paymentText);
                      }}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Payment Instructions
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Form Validation Summary */}
              {form.formState.errors &&
                Object.keys(form.formState.errors).length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-800 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">
                          Please fix the following issues:
                        </span>
                      </div>
                      <ul className="text-sm text-red-700 space-y-1">
                        {Object.entries(form.formState.errors).map(
                          ([field, error]) => (
                            <li key={field}>
                              • {error?.message || `${field} is required`}
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
            </form>
          </Form>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 px-6 py-4 border-t bg-muted/20">
          <div className="flex items-center gap-4 flex-1">
            {/* Quick Save Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Save className="h-3 w-3" />
              <span>Changes are saved automatically</span>
            </div>

            {/* Invoice Total Summary */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Total: </span>
              <span className="text-primary text-lg">
                {currencySymbol}
                {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>

            {!editInvoice && (
              <Button
                type="button"
                variant="secondary"
                disabled={
                  isSaving || !selectedClientId || !validateInvoiceItems()
                }
                onClick={() => {
                  // Save as draft
                  form.setValue("status", "draft");
                  form.handleSubmit(onSubmit)();
                }}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save as Draft
                  </>
                )}
              </Button>
            )}

            <Button
              type="submit"
              form="invoice-form"
              disabled={
                isSaving || !selectedClientId || !validateInvoiceItems()
              }
              className="min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {editInvoice ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {editInvoice ? "Update Invoice" : "Create Invoice"}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// View Dialog Component
interface ViewInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: DisplayInvoice | null;
  onRecordPayment: (invoice: DisplayInvoice) => void;
}
export function ViewInvoiceDialog({
  isOpen,
  onOpenChange,
  invoice,
  onRecordPayment,
}: ViewInvoiceDialogProps) {
  if (!invoice) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
          <Badge className={getStatusColor(invoice.status)}>
            {formatStatus(invoice.status)}
          </Badge>
        </DialogHeader>
        <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-1">Client</h3>
                <p>{invoice.client_name}</p>
                <p className="text-muted-foreground">
                  {invoice.client_address}
                </p>
                <p className="text-muted-foreground">{invoice.client_email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Details</h3>
                <p>Date: {formatDate(invoice.date)}</p>
                <p>Due: {formatDate(invoice.due_date)}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  {invoice.vat_percentage && (
                    <TableRow>
                      <TableCell colSpan={1} className="text-right">
                        VAT ({invoice.vat_percentage}%)
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          calculateTotal(invoice.items) *
                            (invoice.vat_percentage / 100)
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {invoice.discount_percentage && (
                    <TableRow>
                      <TableCell colSpan={1} className="text-right">
                        Discount ({invoice.discount_percentage}%)
                      </TableCell>
                      <TableCell className="text-right">
                        -
                        {formatCurrency(
                          calculateTotal(invoice.items) *
                            (invoice.discount_percentage / 100)
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={1} className="text-right font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                  </TableRow>
                  {invoice.paid_amount > 0 && (
                    <TableRow>
                      <TableCell colSpan={1} className="text-right font-bold">
                        Paid
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(invoice.paid_amount)}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={1} className="text-right font-bold">
                      Balance Due
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(
                        invoice.total_amount - invoice.paid_amount
                      )}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-medium mb-1">Notes</h3>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="gap-2">
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <Button
              onClick={() => {
                onRecordPayment(invoice);
                onOpenChange(false);
              }}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button variant="outline" onClick={() => generateInvoicePDF(invoice)}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          {invoice.status === "draft" && (
            <Button onClick={() => sendInvoiceByEmail(invoice)}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Payment Dialog Component
interface RecordPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: DisplayInvoice | null;
}
export function RecordPaymentDialog({
  isOpen,
  onOpenChange,
  invoice,
}: RecordPaymentDialogProps) {
  const { recordPayment, isRecordingPayment } = useInvoiceMutations();
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.total_amount - (invoice.paid_amount || 0));
    }
  }, [invoice]);

  const handleRecord = async () => {
    if (!invoice) return;
    await recordPayment({ invoice, amount, method, date, notes });
    onOpenChange(false);
  };

  if (!invoice) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            For invoice {invoice.id.substring(0, 8)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="paymentAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Method</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentNotes">Notes</Label>
            <Textarea
              id="paymentNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRecordingPayment}
          >
            Cancel
          </Button>
          <Button onClick={handleRecord} disabled={isRecordingPayment}>
            <Check className="mr-2 h-4 w-4" />
            {isRecordingPayment ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Dialog Component
interface DeleteInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
export function DeleteInvoiceDialog({
  isOpen,
  onOpenChange,
  onConfirm,
}: DeleteInvoiceDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this invoice and unlink any associated
            trips.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
