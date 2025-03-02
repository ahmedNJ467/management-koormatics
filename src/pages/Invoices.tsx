
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays, isAfter, isBefore, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  FileText,
  Send,
  Clock,
  Check,
  X,
  Trash,
  Download,
  MoreHorizontal,
  CreditCard,
  DollarSign,
  Calendar,
  ArrowRight,
  Car,
  User,
} from "lucide-react";
import {
  InvoiceStatus,
  PaymentMethod,
  Invoice,
  DisplayInvoice,
  InvoiceItem,
  SupabaseInvoice,
  SupabaseDisplayInvoice,
} from "@/lib/types/invoice";
import { DisplayTrip, Trip, convertToDisplayTrip } from "@/lib/types";
import { Client } from "@/components/clients/hooks/use-clients-query";

export default function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewInvoice, setViewInvoice] = useState<DisplayInvoice | null>(null);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<DisplayInvoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unit_price: 0, amount: 0 },
  ]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<DisplayInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // Fetch invoices data
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          clients:client_id(name, email, address, phone),
          trips:invoice_id(*)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((invoice: any) => {
        // Convert trip data to proper DisplayTrip objects
        let tripsForInvoice: DisplayTrip[] = [];
        if (invoice.trips && Array.isArray(invoice.trips)) {
          tripsForInvoice = invoice.trips.map((trip: any) => ({
            ...trip,
            // Make sure required fields are set
            type: trip.type || trip.service_type || 'other',
            status: trip.status || 'scheduled',
            client_name: invoice.clients?.name || "Unknown Client",
            vehicle_details: "Vehicle details not available",
            driver_name: "Driver not assigned",
          } as DisplayTrip));
        }
        
        // Parse items from JSON to ensure correct typing
        let parsedItems: InvoiceItem[] = [];
        if (invoice.items) {
          try {
            if (typeof invoice.items === 'string') {
              parsedItems = JSON.parse(invoice.items);
            } else {
              parsedItems = invoice.items as InvoiceItem[];
            }
          } catch (e) {
            console.error("Error parsing invoice items:", e);
            parsedItems = [];
          }
        }
        
        return {
          ...invoice,
          items: parsedItems,
          // Add properly typed trips array
          trips: tripsForInvoice,
          // Other fields
          client_name: invoice.clients?.name || "Unknown Client",
          client_email: invoice.clients?.email || "",
          client_address: invoice.clients?.address || "",
          client_phone: invoice.clients?.phone || "",
        } as DisplayInvoice;
      });
    },
  });

  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, address, phone")
        .order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch available trips (not yet invoiced) for the selected client
  const { data: availableTrips, refetch: refetchAvailableTrips } = useQuery({
    queryKey: ["availableTrips", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];

      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email, address, phone),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .eq("client_id", selectedClientId)
        .is("invoice_id", null)
        .in("status", ["completed", "in_progress"])
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((trip: any) => ({
        ...trip,
        type: trip.type || trip.service_type || 'other',
        status: trip.status || 'scheduled',
        client_name: trip.clients?.name || "Unknown Client",
        vehicle_details: `${trip.vehicles?.make || ""} ${trip.vehicles?.model || ""} (${trip.vehicles?.registration || ""})`,
        driver_name: trip.drivers?.name || "Unknown Driver",
      } as DisplayTrip));
    },
    enabled: !!selectedClientId,
  });

  // Effect to update available trips when client changes
  useEffect(() => {
    if (selectedClientId) {
      refetchAvailableTrips();
      setSelectedTrips([]);
    }
  }, [selectedClientId, refetchAvailableTrips]);

  // Effect to initialize payment amount when marking an invoice as paid
  useEffect(() => {
    if (invoiceToMarkPaid) {
      const remainingAmount = invoiceToMarkPaid.total_amount - (invoiceToMarkPaid.paid_amount || 0);
      setPaymentAmount(remainingAmount);
    }
  }, [invoiceToMarkPaid]);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel("invoices-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "invoices" }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Calculate total amount for invoice items
  const calculateTotal = (items: InvoiceItem[]): number => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  // Update invoice item amount when quantity or unit price changes
  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amount if quantity or unit_price changed
    if (field === "quantity" || field === "unit_price") {
      const quantity = field === "quantity" ? value : updatedItems[index].quantity;
      const unitPrice = field === "unit_price" ? value : updatedItems[index].unit_price;
      updatedItems[index].amount = quantity * unitPrice;
    }
    
    setInvoiceItems(updatedItems);
  };

  // Add a new invoice item
  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  // Remove an invoice item
  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length <= 1) return; // Keep at least one item
    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updatedItems);
  };

  // Handle saving an invoice (new or edit)
  const handleSaveInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const totalAmount = calculateTotal(invoiceItems);
    
    try {
      if (editInvoice) {
        // Update existing invoice
        const { error } = await supabase
          .from("invoices")
          .update({
            client_id: formData.get("client_id") as string,
            date: formData.get("date") as string,
            due_date: formData.get("due_date") as string,
            status: formData.get("status") as InvoiceStatus,
            items: invoiceItems,
            total_amount: totalAmount,
            notes: formData.get("notes") as string || null,
          })
          .eq("id", editInvoice.id);
        
        if (error) throw error;

        toast({
          title: "Invoice updated",
          description: "Invoice details have been updated successfully",
        });
        
        setEditInvoice(null);
      } else {
        // Create new invoice
        const { data, error } = await supabase
          .from("invoices")
          .insert({
            client_id: formData.get("client_id") as string,
            date: formData.get("date") as string,
            due_date: formData.get("due_date") as string,
            status: formData.get("status") as InvoiceStatus || "draft",
            items: invoiceItems,
            total_amount: totalAmount,
            paid_amount: 0,
            notes: formData.get("notes") as string || null,
          })
          .select();
        
        if (error) throw error;

        // If trips were selected, update them with the invoice_id
        if (selectedTrips.length > 0 && data && data[0]) {
          const invoiceId = data[0].id;
          
          const { error: updateError } = await supabase
            .from("trips")
            .update({ invoice_id: invoiceId })
            .in("id", selectedTrips);
          
          if (updateError) {
            console.error("Error updating trips with invoice ID:", updateError);
            toast({
              title: "Warning",
              description: "Invoice created but failed to link some trips",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Invoice created",
          description: "New invoice has been created successfully",
        });
        
        setCreateInvoiceOpen(false);
        setSelectedClientId("");
        setSelectedTrips([]);
        setInvoiceItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
      }
      
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["availableTrips"] });
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: "Failed to save invoice details",
        variant: "destructive",
      });
    }
  };

  // Handle marking an invoice as paid
  const handleRecordPayment = async () => {
    if (!invoiceToMarkPaid) return;
    
    try {
      const newPaidAmount = (invoiceToMarkPaid.paid_amount || 0) + paymentAmount;
      const newStatus: InvoiceStatus = 
        newPaidAmount >= invoiceToMarkPaid.total_amount ? "paid" : "sent";
      
      const { error } = await supabase
        .from("invoices")
        .update({
          paid_amount: newPaidAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          status: newStatus,
          notes: invoiceToMarkPaid.notes 
            ? `${invoiceToMarkPaid.notes}\n\nPayment (${format(new Date(paymentDate), "MMM d, yyyy")}): ${paymentNotes}`
            : `Payment (${format(new Date(paymentDate), "MMM d, yyyy")}): ${paymentNotes}`,
        })
        .eq("id", invoiceToMarkPaid.id);
      
      if (error) throw error;

      toast({
        title: "Payment recorded",
        description: newStatus === "paid" 
          ? "Invoice has been marked as fully paid" 
          : "Partial payment has been recorded",
      });
      
      setPaymentDialogOpen(false);
      setInvoiceToMarkPaid(null);
      setPaymentAmount(0);
      setPaymentMethod("bank_transfer");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setPaymentNotes("");
      
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  // Delete invoice
  const deleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    try {
      // First, remove invoice_id from associated trips
      const { error: tripUpdateError } = await supabase
        .from("trips")
        .update({ invoice_id: null })
        .eq("invoice_id", invoiceToDelete);
      
      if (tripUpdateError) {
        console.error("Error unlinking trips:", tripUpdateError);
      }
      
      // Then delete the invoice
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceToDelete);

      if (error) throw error;

      toast({
        title: "Invoice deleted",
        description: "Invoice has been deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      
      // Close any open dialogs if they were showing the deleted invoice
      if (viewInvoice && viewInvoice.id === invoiceToDelete) setViewInvoice(null);
      if (editInvoice && editInvoice.id === invoiceToDelete) setEditInvoice(null);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  // Helper functions for formatting
  const formatStatus = (status: InvoiceStatus): string => {
    return status.replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  
  const formatDate = (dateStr: string): string => {
    return format(new Date(dateStr), "MMM d, yyyy");
  };
  
  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "paid":
        return "bg-green-100 text-green-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Format invoice ID to show first 8 characters
  const formatInvoiceId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };

  // Check if an invoice is overdue
  const isInvoiceOverdue = (invoice: Invoice): boolean => {
    return (
      invoice.status === "sent" &&
      isBefore(parseISO(invoice.due_date), new Date())
    );
  };

  // Update invoice statuses based on due dates
  useEffect(() => {
    const updateOverdueInvoices = async () => {
      const overdueInvoices = invoices?.filter(isInvoiceOverdue) || [];
      
      for (const invoice of overdueInvoices) {
        await supabase
          .from("invoices")
          .update({ status: "overdue" })
          .eq("id", invoice.id);
      }
      
      if (overdueInvoices.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      }
    };
    
    updateOverdueInvoices();
  }, [invoices, queryClient]);

  // Filter invoices based on search and status filter
  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = 
      searchTerm === "" ||
      invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatInvoiceId(invoice.id).includes(searchTerm.toUpperCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Generate a PDF invoice (placeholder function)
  const generateInvoicePDF = (invoice: DisplayInvoice) => {
    toast({
      title: "PDF Generation",
      description: "PDF generation would happen here in a real app",
    });
    console.log("Generating PDF for invoice:", invoice);
  };

  // Send invoice by email (placeholder function)
  const sendInvoiceByEmail = (invoice: DisplayInvoice) => {
    toast({
      title: "Email Sending",
      description: "Email sending would happen here in a real app",
    });
    console.log("Sending invoice by email:", invoice);
  };

  if (invoicesLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage client invoices and payments</p>
        </div>
        <Button onClick={() => setCreateInvoiceOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No invoices found. Try adjusting your search or create a new invoice.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices?.map((invoice) => (
                <TableRow key={invoice.id} className="group">
                  <TableCell className="font-medium">
                    {formatInvoiceId(invoice.id)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.client_name}</div>
                    {invoice.client_email && (
                      <div className="text-sm text-muted-foreground">{invoice.client_email}</div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(invoice.total_amount)}</div>
                    {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
                      <div className="text-sm text-muted-foreground">
                        Paid: {formatCurrency(invoice.paid_amount)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      {formatStatus(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewInvoice(invoice)}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setViewInvoice(invoice)}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditInvoice(invoice)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Edit Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generateInvoicePDF(invoice)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          
                          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                            <DropdownMenuItem onClick={() => {
                              setInvoiceToMarkPaid(invoice);
                              setPaymentDialogOpen(true);
                            }}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                          )}
                          
                          {invoice.status === "draft" && (
                            <DropdownMenuItem onClick={() => sendInvoiceByEmail(invoice)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send to Client
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => {
                              setInvoiceToDelete(invoice.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Form Dialog (Create & Edit) */}
      <Dialog open={createInvoiceOpen || !!editInvoice} onOpenChange={(open) => {
        if (!open) {
          setCreateInvoiceOpen(false);
          setEditInvoice(null);
          setSelectedClientId("");
          setSelectedTrips([]);
          setInvoiceItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
            <DialogDescription>
              {editInvoice 
                ? `Edit invoice details for ${editInvoice.client_name}`
                : "Create a new invoice for a client"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
            <form onSubmit={handleSaveInvoice} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select 
                  name="client_id" 
                  value={editInvoice?.client_id || selectedClientId}
                  onValueChange={setSelectedClientId}
                  disabled={!!editInvoice}
                  required
                >
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Invoice Date</Label>
                  <Input 
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={editInvoice?.date || format(new Date(), "yyyy-MM-dd")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input 
                    id="due_date"
                    name="due_date"
                    type="date"
                    defaultValue={editInvoice?.due_date || format(addDays(new Date(), 30), "yyyy-MM-dd")}
                    required
                  />
                </div>
              </div>

              {!editInvoice && selectedClientId && (
                <div className="space-y-2 border p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Select Trips to Invoice</Label>
                    <span className="text-sm text-muted-foreground">
                      {selectedTrips.length} selected
                    </span>
                  </div>
                  
                  {availableTrips?.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No uninvoiced trips available for this client
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {availableTrips?.map((trip) => (
                        <div key={trip.id} className="flex items-center space-x-2 p-2 border rounded-md">
                          <Checkbox 
                            id={`trip-${trip.id}`}
                            checked={selectedTrips.includes(trip.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTrips([...selectedTrips, trip.id]);
                                
                                // Add trip as an invoice item
                                const tripDate = format(new Date(trip.date), "MMM d, yyyy");
                                const description = `Transportation service on ${tripDate}`;
                                const amount = trip.amount || 0;
                                
                                setInvoiceItems([
                                  ...invoiceItems,
                                  { 
                                    description, 
                                    quantity: 1, 
                                    unit_price: amount, 
                                    amount 
                                  }
                                ]);
                              } else {
                                setSelectedTrips(selectedTrips.filter(id => id !== trip.id));
                                
                                // Remove corresponding invoice item (if we can identify it)
                                const tripDate = format(new Date(trip.date), "MMM d, yyyy");
                                const itemIndex = invoiceItems.findIndex(
                                  item => item.description.includes(tripDate)
                                );
                                
                                if (itemIndex !== -1) {
                                  const updatedItems = [...invoiceItems];
                                  updatedItems.splice(itemIndex, 1);
                                  setInvoiceItems(updatedItems);
                                }
                              }
                            }}
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={`trip-${trip.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {format(new Date(trip.date), "MMM d, yyyy")}
                            </Label>
                            <div className="text-sm text-muted-foreground">
                              {trip.pickup_location && trip.dropoff_location ? (
                                <span>{trip.pickup_location} to {trip.dropoff_location}</span>
                              ) : (
                                <span>{trip.pickup_location || trip.dropoff_location}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(trip.amount || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <Label>Invoice Items</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addInvoiceItem}
                    className="h-8 px-2"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input 
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, "description", e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, "quantity", parseFloat(e.target.value))}
                          min="1"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number"
                          placeholder="Price"
                          value={item.unit_price}
                          onChange={(e) => updateInvoiceItem(index, "unit_price", parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {invoiceItems.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeInvoiceItem(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-2">
                  <div className="w-1/3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateTotal(invoiceItems))}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(calculateTotal(invoiceItems))}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes"
                  name="notes"
                  placeholder="Add any notes or payment instructions"
                  defaultValue={editInvoice?.notes || ""}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editInvoice?.status || "draft"} required>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  if (editInvoice) {
                    setEditInvoice(null);
                  } else {
                    setCreateInvoiceOpen(false);
                  }
                  setSelectedClientId("");
                  setSelectedTrips([]);
                  setInvoiceItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editInvoice ? "Save Changes" : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail View Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={(open) => !open && setViewInvoice(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          {viewInvoice && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-xl">
                      Invoice #{formatInvoiceId(viewInvoice.id)}
                    </DialogTitle>
                    <DialogDescription>
                      Created on {formatDate(viewInvoice.date)}
                    </DialogDescription>
                  </div>
                  <Badge className={getStatusColor(viewInvoice.status)}>
                    {formatStatus(viewInvoice.status)}
                  </Badge>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(90vh-160px)]">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Bill To</h3>
                      <p className="text-sm font-medium">{viewInvoice.client_name}</p>
                      {viewInvoice.client_address && (
                        <p className="text-sm">{viewInvoice.client_address}</p>
                      )}
                      {viewInvoice.client_email && (
                        <p className="text-sm">{viewInvoice.client_email}</p>
                      )}
                      {viewInvoice.client_phone && (
                        <p className="text-sm">{viewInvoice.client_phone}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Invoice Details</h3>
                      <p className="text-sm">
                        <span className="font-medium">Invoice Date:</span> {formatDate(viewInvoice.date)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Due Date:</span> {formatDate(viewInvoice.due_date)}
                      </p>
                      {viewInvoice.payment_date && (
                        <p className="text-sm">
                          <span className="font-medium">Payment Date:</span> {formatDate(viewInvoice.payment_date)}
                        </p>
                      )}
                      {viewInvoice.payment_method && (
                        <p className="text-sm">
                          <span className="font-medium">Payment Method:</span> {viewInvoice.payment_method.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Invoice Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(viewInvoice.total_amount)}</TableCell>
                        </TableRow>
                        {viewInvoice.paid_amount > 0 && (
                          <>
                            <TableRow>
                              <TableCell colSpan={3} className="text-right">Paid</TableCell>
                              <TableCell className="text-right">{formatCurrency(viewInvoice.paid_amount)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-medium">Balance Due</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(viewInvoice.total_amount - viewInvoice.paid_amount)}
                              </TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableFooter>
                    </Table>
                  </div>

                  {viewInvoice.trips && viewInvoice.trips.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Related Trips</h3>
                      <div className="space-y-2">
                        {viewInvoice.trips.map((trip) => (
                          <Card key={trip.id} className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{formatDate(trip.date)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {trip.pickup_location && trip.dropoff_location ? (
                                    <span>{trip.pickup_location} to {trip.dropoff_location}</span>
                                  ) : (
                                    <span>{trip.pickup_location || trip.dropoff_location}</span>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline">
                                {trip.type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewInvoice.notes && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">Notes</h3>
                      <div className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">
                        {viewInvoice.notes}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="gap-2 sm:gap-0">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => generateInvoicePDF(viewInvoice)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  {viewInvoice.status !== "paid" && viewInvoice.status !== "cancelled" && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setInvoiceToMarkPaid(viewInvoice);
                        setPaymentDialogOpen(true);
                      }}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Record Payment
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setEditInvoice(viewInvoice)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setInvoiceToDelete(viewInvoice.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice #{invoiceToMarkPaid ? formatInvoiceId(invoiceToMarkPaid.id) : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment_amount">Payment Amount</Label>
              <Input 
                id="payment_amount" 
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                min="0.01"
                step="0.01"
                required
              />
              {invoiceToMarkPaid && (
                <div className="text-sm text-muted-foreground">
                  Total: {formatCurrency(invoiceToMarkPaid.total_amount)}, 
                  Previously Paid: {formatCurrency(invoiceToMarkPaid.paid_amount || 0)}, 
                  Remaining: {formatCurrency(invoiceToMarkPaid.total_amount - (invoiceToMarkPaid.paid_amount || 0))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date</Label>
              <Input 
                id="payment_date" 
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_notes">Notes</Label>
              <Textarea 
                id="payment_notes" 
                placeholder="Add any notes about this payment"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPaymentDialogOpen(false);
              setInvoiceToMarkPaid(null);
              setPaymentAmount(0);
              setPaymentMethod("bank_transfer");
              setPaymentDate(format(new Date(), "yyyy-MM-dd"));
              setPaymentNotes("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleRecordPayment}
              disabled={paymentAmount <= 0}
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              invoice and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setInvoiceToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteInvoice} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
