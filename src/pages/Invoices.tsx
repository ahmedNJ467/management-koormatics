
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, addDays, isAfter } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Search,
  FileText,
  Users,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Printer,
  Send,
  Download,
  Eye,
  Edit,
  Trash,
  Check,
  X,
  Receipt,
  CreditCard,
  Clock,
  Car,
  AlertCircle,
  TrendingUp,
  ArrowUp
} from "lucide-react";
import {
  Client,
  Invoice,
  DisplayInvoice,
  InvoiceItem,
  InvoiceStatus,
  DisplayTrip,
  DisplayQuotation,
  Trip,
  Quotation,
  convertToDisplayTrips
} from "@/lib/types";

export default function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewInvoice, setViewInvoice] = useState<DisplayInvoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<DisplayInvoice | null>(null);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedQuotation, setSelectedQuotation] = useState<string>("");
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState("details");
  
  // Initial item for new invoices
  const initialItem: InvoiceItem = {
    description: "",
    quantity: 1,
    unit_price: 0,
    amount: 0
  };

  // Fetch invoices data
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          clients:client_id(name, email, address, phone)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      // Check for overdue invoices
      const updatedInvoices = await Promise.all(data.map(async (invoice) => {
        let status = invoice.status;
        
        // Mark as overdue if due date has passed and status is still 'sent'
        if (invoice.status === 'sent' && isAfter(new Date(), new Date(invoice.due_date))) {
          status = 'overdue';
          
          // Update the status in the database
          await supabase
            .from("invoices")
            .update({ status: 'overdue' })
            .eq("id", invoice.id);
        }
        
        // Get associated trips
        const { data: tripData } = await supabase
          .from("trips")
          .select(`
            *,
            clients:client_id(name),
            vehicles:vehicle_id(make, model, registration),
            drivers:driver_id(name)
          `)
          .eq("invoice_id", invoice.id);
        
        // Use the convertToDisplayTrips helper function to ensure all needed fields are present
        const trips = tripData ? convertToDisplayTrips(tripData) : [];

        // Get quotation number if there's a quotation
        let quotation_number = null;
        if (invoice.quotation_id) {
          const { data: quotationData } = await supabase
            .from("quotations")
            .select("id")
            .eq("id", invoice.quotation_id)
            .single();
          
          if (quotationData) {
            quotation_number = quotationData.id.substring(0, 8).toUpperCase();
          }
        }
        
        // Parse items from JSON to proper InvoiceItem array
        const parsedItems = Array.isArray(invoice.items) 
          ? invoice.items.map(item => {
              const itemObj = item as Record<string, any>;
              return {
                description: itemObj?.description?.toString() || "",
                quantity: Number(itemObj?.quantity) || 0,
                unit_price: Number(itemObj?.unit_price) || 0,
                amount: Number(itemObj?.amount) || 0
              };
            })
          : [];
        
        return {
          ...invoice,
          status,
          client_name: invoice.clients?.name || "Unknown Client",
          client_email: invoice.clients?.email,
          client_address: invoice.clients?.address,
          client_phone: invoice.clients?.phone,
          trips,
          quotation_number,
          items: parsedItems
        } as DisplayInvoice;
      }));

      return updatedInvoices;
    },
  });

  // Fetch clients data for dropdown
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

  // Fetch quotations data for dropdown
  const { data: quotations, isLoading: quotationsLoading, error: quotationsError } = useQuery({
    queryKey: ["quotations", selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          clients:client_id(name, email)
        `)
        .eq("client_id", selectedClient)
        .eq("status", "approved")
        .order("date", { ascending: false });
      
      if (error) throw error;
      
      return data.map(quotation => {
        // Parse items from JSON to proper QuotationItem array
        const parsedItems = Array.isArray(quotation.items) 
          ? quotation.items.map(item => {
              const itemObj = item as Record<string, any>;
              return {
                description: itemObj?.description?.toString() || "",
                quantity: Number(itemObj?.quantity) || 0,
                unit_price: Number(itemObj?.unit_price) || 0,
                amount: Number(itemObj?.amount) || 0
              };
            })
          : [];
        
        return {
          ...quotation,
          items: parsedItems,
          client_name: quotation.clients?.name || "Unknown Client",
          client_email: quotation.clients?.email
        } as DisplayQuotation;
      });
    },
    enabled: !!selectedClient,
  });

  // Fetch uninvoiced trips for selected client
  const { data: availableTrips, isLoading: tripsLoading, error: tripsError } = useQuery({
    queryKey: ["trips", "uninvoiced", selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name)
        `)
        .eq("client_id", selectedClient)
        .is("invoice_id", null)
        .in("status", ["completed"])
        .order("date", { ascending: false });
      
      if (error) throw error;
      
      return convertToDisplayTrips(data);
    },
    enabled: !!selectedClient,
  });

  // Calculate dashboard metrics
  const getDashboardMetrics = () => {
    if (!invoices) return {
      totalInvoiced: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      averagePaymentTime: 0,
      invoiceCount: 0,
      overdueCount: 0
    };

    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.paid_amount, 0);
    const totalPending = totalInvoiced - totalPaid;
    
    const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue');
    const totalOverdue = overdueInvoices.reduce((sum, invoice) => sum + (invoice.total_amount - invoice.paid_amount), 0);
    const overdueCount = overdueInvoices.length;
    
    // Calculate average payment time for paid invoices (in days)
    let totalPaymentDays = 0;
    let paidInvoicesCount = 0;
    
    invoices.forEach(invoice => {
      if (invoice.status === 'paid' && invoice.payment_date) {
        const invoiceDate = new Date(invoice.date);
        const paymentDate = new Date(invoice.payment_date);
        const daysDifference = Math.round((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        totalPaymentDays += daysDifference;
        paidInvoicesCount++;
      }
    });
    
    const averagePaymentTime = paidInvoicesCount > 0 ? Math.round(totalPaymentDays / paidInvoicesCount) : 0;
    
    return {
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      averagePaymentTime,
      invoiceCount: invoices.length,
      overdueCount
    };
  };

  // Get month-over-month revenue growth
  const getRevenueGrowth = () => {
    if (!invoices || invoices.length === 0) return 0;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const currentMonthYear = currentMonth === 0 ? today.getFullYear() - 1 : today.getFullYear();
    
    // Calculate current month revenue
    const currentMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === today.getFullYear();
    });
    
    const currentMonthRevenue = currentMonthInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    
    // Calculate last month revenue
    const lastMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate.getMonth() === lastMonth && invoiceDate.getFullYear() === currentMonthYear;
    });
    
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    
    // Calculate growth rate
    if (lastMonthRevenue === 0) return currentMonthRevenue > 0 ? 100 : 0;
    
    return Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
  };

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

  // Initialize invoice items based on selected quotation or trips
  useEffect(() => {
    if (selectedQuotation && quotations) {
      const quotation = quotations.find(q => q.id === selectedQuotation);
      if (quotation && quotation.items) {
        setInvoiceItems(quotation.items);
      }
    } else if (selectedTrips.length > 0 && availableTrips) {
      const newItems = selectedTrips.map(tripId => {
        const trip = availableTrips.find(t => t.id === tripId);
        return {
          description: `${formatTripType(trip?.type || 'other')} - ${format(parseISO(trip?.date || new Date().toISOString()), 'MMM d, yyyy')}`,
          quantity: 1,
          unit_price: trip?.amount || 0,
          amount: trip?.amount || 0
        };
      });
      setInvoiceItems(newItems);
    } else if (editInvoice) {
      setInvoiceItems(editInvoice.items);
    } else if (invoiceItems.length === 0) {
      setInvoiceItems([{...initialItem}]);
    }
  }, [selectedQuotation, quotations, selectedTrips, availableTrips, editInvoice]);

  // Reset form when creating new invoice
  useEffect(() => {
    if (!createInvoiceOpen && !editInvoice) {
      setSelectedClient("");
      setSelectedQuotation("");
      setSelectedTrips([]);
      setInvoiceItems([{...initialItem}]);
    }
  }, [createInvoiceOpen, editInvoice]);

  // Reset form when editing invoice
  useEffect(() => {
    if (editInvoice) {
      setSelectedClient(editInvoice.client_id);
      setSelectedQuotation(editInvoice.quotation_id || "");
      setInvoiceItems(editInvoice.items);
    }
  }, [editInvoice]);

  // Set payment amount to remaining balance
  useEffect(() => {
    if (viewInvoice && recordPaymentOpen) {
      const remainingBalance = viewInvoice.total_amount - viewInvoice.paid_amount;
      setPaymentAmount(remainingBalance.toFixed(2));
    }
  }, [viewInvoice, recordPaymentOpen]);

  // Update item amount when quantity or unit price changes
  const updateItemAmount = (index: number, quantity: number, unitPrice: number) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].unit_price = unitPrice;
    updatedItems[index].amount = quantity * unitPrice;
    setInvoiceItems(updatedItems);
  };

  // Add a new item to the invoice
  const addItem = () => {
    setInvoiceItems([...invoiceItems, {...initialItem}]);
  };

  // Remove an item from the invoice
  const removeItem = (index: number) => {
    if (invoiceItems.length > 1) {
      const updatedItems = invoiceItems.filter((_, i) => i !== index);
      setInvoiceItems(updatedItems);
    }
  };

  // Calculate total amount from invoice items
  const calculateTotal = (): number => {
    return invoiceItems.reduce((total, item) => total + item.amount, 0);
  };

  // Handle client selection
  const handleClientChange = (value: string) => {
    setSelectedClient(value);
    setSelectedQuotation("");
    setSelectedTrips([]);
  };

  // Handle quotation selection
  const handleQuotationChange = (value: string) => {
    if (value === "_none") {
      setSelectedQuotation("");
    } else {
      setSelectedQuotation(value);
    }
  };

  // Save invoice (create or update)
  const handleSaveInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    // Convert InvoiceItem[] to a JSON-compatible format for Supabase
    const invoiceData = {
      client_id: formData.get("client_id") as string,
      date: formData.get("date") as string,
      due_date: formData.get("due_date") as string,
      items: invoiceItems as any, // Cast to any to bypass type checking
      total_amount: calculateTotal(),
      paid_amount: editInvoice ? editInvoice.paid_amount : 0,
      status: formData.get("status") as InvoiceStatus || "draft",
      quotation_id: selectedQuotation || null,
      notes: formData.get("notes") as string || null
    };
    
    try {
      if (editInvoice) {
        // Update existing invoice
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", editInvoice.id);
          
        if (error) throw error;

        toast({
          title: "Invoice updated",
          description: "Invoice has been updated successfully",
        });
        
        setEditInvoice(null);
      } else {
        // Create new invoice
        const { data, error } = await supabase
          .from("invoices")
          .insert(invoiceData as any) // Cast to any to bypass type checking
          .select();
          
        if (error) throw error;
        
        // Update trips with invoice_id if any trips were selected
        if (selectedTrips.length > 0 && data) {
          const newInvoiceId = data[0].id;
          
          const { error: tripsError } = await supabase
            .from("trips")
            .update({ invoice_id: newInvoiceId })
            .in("id", selectedTrips);
            
          if (tripsError) throw tripsError;
        }

        toast({
          title: "Invoice created",
          description: "New invoice has been created successfully",
        });
        
        setCreateInvoiceOpen(false);
      }
      
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["trips", "uninvoiced"] });
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      });
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    try {
      // Release any associated trips
      await supabase
        .from("trips")
        .update({ invoice_id: null })
        .eq("invoice_id", invoiceToDelete);
      
      // Delete the invoice
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceToDelete);
        
      if (error) throw error;

      toast({
        title: "Invoice deleted",
        description: "Invoice has been deleted successfully",
      });
      
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      
      // Close any open dialogs if they were showing the deleted invoice
      if (viewInvoice && viewInvoice.id === invoiceToDelete) setViewInvoice(null);
      if (editInvoice && editInvoice.id === invoiceToDelete) setEditInvoice(null);
      
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  // Update invoice status
  const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", invoiceId);
        
      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Invoice status changed to ${formatStatus(status)}`,
      });
      
      // Update local state if it's the currently viewed invoice
      if (viewInvoice && viewInvoice.id === invoiceId) {
        setViewInvoice({...viewInvoice, status});
      }
      
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      });
    }
  };

  // Record payment for an invoice
  const handleRecordPayment = async () => {
    if (!viewInvoice) return;
    
    try {
      const paymentAmountNum = parseFloat(paymentAmount);
      if (isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
        throw new Error("Invalid payment amount");
      }
      
      const newPaidAmount = viewInvoice.paid_amount + paymentAmountNum;
      const newStatus = newPaidAmount >= viewInvoice.total_amount ? "paid" : viewInvoice.status;
      
      const { error } = await supabase
        .from("invoices")
        .update({
          paid_amount: newPaidAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          status: newStatus
        })
        .eq("id", viewInvoice.id);
        
      if (error) throw error;

      toast({
        title: "Payment recorded",
        description: `Payment of ${formatCurrency(paymentAmountNum)} has been recorded`,
      });
      
      setRecordPaymentOpen(false);
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

  // Send invoice to client
  const sendInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId);
        
      if (error) throw error;

      toast({
        title: "Invoice sent",
        description: "Invoice has been marked as sent to client",
      });
      
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    }
  };

  // Helper functions for formatting
  const formatInvoiceId = (id: string): string => {
    return id ? "INV-" + id.substring(0, 8).toUpperCase() : "INV-XXXXXXXX";
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "Unknown Date";
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };
  
  const formatStatus = (status: InvoiceStatus): string => {
    if (!status) return "Unknown";
    return status.replace("_", " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const getStatusColor = (status: InvoiceStatus): string => {
    if (!status) return "bg-gray-100 text-gray-700";
    
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "paid":
        return "bg-green-100 text-green-700";
      case "overdue":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Format trip type for better display
  const formatTripType = (type: string): string => {
    if (!type) return "Transfer";
    
    switch (type) {
      case "airport_pickup":
        return "Airport Pickup";
      case "airport_dropoff":
        return "Airport Dropoff";
      case "other":
        return "Transfer";
      case "hourly":
        return "Hourly Service";
      case "full_day":
        return "Full Day Service";
      case "multi_day":
        return "Multi-Day Service";
      default:
        try {
          return type.replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        } catch (error) {
          console.error("Error formatting trip type:", error);
          return "Unknown Type";
        }
    }
  };

  // Filter invoices based on search and status filter
  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = 
      searchTerm === "" ||
      invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatInvoiceId(invoice.id).includes(searchTerm.toUpperCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate dashboard metrics
  const metrics = getDashboardMetrics();
  const revenueGrowth = getRevenueGrowth();

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

  // Handle loading and error states for dependent data
  const isFormDataLoading = createInvoiceOpen && (
    (selectedClient && (quotationsLoading || tripsLoading))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage client invoices and payments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateInvoiceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Total Invoiced
              </CardTitle>
            </div>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalInvoiced)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {revenueGrowth > 0 ? (
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {revenueGrowth}% from last month
                </span>
              ) : revenueGrowth < 0 ? (
                <span className="text-red-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1 rotate-180" />
                  {Math.abs(revenueGrowth)}% from last month
                </span>
              ) : (
                <span>No change from last month</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Total Paid
              </CardTitle>
            </div>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((metrics.totalPaid / metrics.totalInvoiced) * 100) || 0}% of total invoiced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Pending Payments
              </CardTitle>
            </div>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalPending)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {invoices?.filter(inv => inv.status === 'sent').length || 0} pending invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                Overdue Payments
              </CardTitle>
            </div>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalOverdue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {metrics.overdueCount} overdue {metrics.overdueCount === 1 ? 'invoice' : 'invoices'}
            </p>
          </CardContent>
        </Card>
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices && filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="font-medium">{formatInvoiceId(invoice.id)}</div>
                    {invoice.quotation_number && (
                      <div className="text-xs text-muted-foreground">
                        Ref: {invoice.quotation_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.client_name}</div>
                    {invoice.client_email && (
                      <div className="text-xs text-muted-foreground">{invoice.client_email}</div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(invoice.status)}>
                      {formatStatus(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.total_amount)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.paid_amount)}
                    {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
                      <div className="text-xs text-muted-foreground">
                        {Math.round((invoice.paid_amount / invoice.total_amount) * 100)}%
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setViewInvoice(invoice)}>
                            <Eye className="h-4 w-4 mr-2" /> View Invoice
                          </DropdownMenuItem>
                          {invoice.status === "draft" && (
                            <DropdownMenuItem onClick={() => sendInvoice(invoice.id)}>
                              <Send className="h-4 w-4 mr-2" /> Send to Client
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                            <>
                              <DropdownMenuItem onClick={() => setEditInvoice(invoice)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setViewInvoice(invoice);
                                setRecordPaymentOpen(true);
                              }}>
                                <CreditCard className="h-4 w-4 mr-2" /> Record Payment
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            onClick={() => {
                              setInvoiceToDelete(invoice.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {invoices && invoices.length > 0 ? (
                    <div className="text-muted-foreground">
                      No invoices match your search or filter. Try adjusting your criteria.
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-1">No Invoices Yet</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-4">
                        Create your first invoice to start billing clients.
                      </p>
                      <Button onClick={() => setCreateInvoiceOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={viewInvoice !== null} onOpenChange={(open) => !open && setViewInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice && formatInvoiceId(viewInvoice.id)}</DialogTitle>
          </DialogHeader>
          
          {viewInvoice && (
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                {viewInvoice.trips && viewInvoice.trips.length > 0 && (
                  <TabsTrigger value="trips">Associated Trips</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="details" className="flex-1 overflow-auto">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Client</h3>
                    <p>{viewInvoice.client_name}</p>
                    {viewInvoice.client_email && <p className="text-sm">{viewInvoice.client_email}</p>}
                    {viewInvoice.client_address && <p className="text-sm">{viewInvoice.client_address}</p>}
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-semibold mb-1">Invoice Information</h3>
                    <p><span className="text-muted-foreground">Status:</span> <Badge className={getStatusColor(viewInvoice.status)}>{formatStatus(viewInvoice.status)}</Badge></p>
                    <p><span className="text-muted-foreground">Date:</span> {formatDate(viewInvoice.date)}</p>
                    <p><span className="text-muted-foreground">Due Date:</span> {formatDate(viewInvoice.due_date)}</p>
                  </div>
                </div>
                
                <h3 className="text-sm font-semibold mb-2">Invoice Items</h3>
                <div className="rounded-md border mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-full">Description</TableHead>
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
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={3} className="pl-4 pr-4 py-2 text-right font-semibold">Total:</td>
                        <td className="pl-4 pr-4 py-2 text-right font-semibold">{formatCurrency(viewInvoice.total_amount)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="pl-4 pr-4 py-2 text-right">Paid Amount:</td>
                        <td className="pl-4 pr-4 py-2 text-right">{formatCurrency(viewInvoice.paid_amount)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="pl-4 pr-4 py-2 text-right font-semibold">Balance Due:</td>
                        <td className="pl-4 pr-4 py-2 text-right font-semibold">{formatCurrency(viewInvoice.total_amount - viewInvoice.paid_amount)}</td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
                
                {viewInvoice.notes && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2">Notes</h3>
                    <p className="text-sm whitespace-pre-line">{viewInvoice.notes}</p>
                  </div>
                )}
                
                {viewInvoice.payment_method && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2">Payment Information</h3>
                    <p><span className="text-muted-foreground">Method:</span> {viewInvoice.payment_method.replace(/_/g, ' ')}</p>
                    {viewInvoice.payment_date && (
                      <p><span className="text-muted-foreground">Date:</span> {formatDate(viewInvoice.payment_date)}</p>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {viewInvoice.trips && viewInvoice.trips.length > 0 && (
                <TabsContent value="trips" className="flex-1 overflow-auto">
                  <div className="rounded-md border mb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewInvoice.trips.map((trip) => (
                          <TableRow key={trip.id}>
                            <TableCell>{formatDate(trip.date)}</TableCell>
                            <TableCell>{formatTripType(trip.type)}</TableCell>
                            <TableCell>{trip.driver_name}</TableCell>
                            <TableCell>{trip.vehicle_details}</TableCell>
                            <TableCell className="text-right">{formatCurrency(trip.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}
          
          <DialogFooter className="mt-6 flex gap-2">
            {viewInvoice && viewInvoice.status === "draft" && (
              <Button 
                variant="outline" 
                className="mr-auto"
                onClick={() => sendInvoice(viewInvoice.id)}
              >
                <Send className="mr-2 h-4 w-4" /> Send to Client
              </Button>
            )}
            
            {viewInvoice && (viewInvoice.status === "sent" || viewInvoice.status === "overdue") && (
              <Button 
                variant="outline" 
                className="mr-auto"
                onClick={() => setRecordPaymentOpen(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            )}
            
            <Button variant="secondary" onClick={() => setViewInvoice(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {viewInvoice && formatInvoiceId(viewInvoice.id)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              {viewInvoice && (
                <p className="text-xs text-muted-foreground">
                  Remaining balance: {formatCurrency(viewInvoice.total_amount - viewInvoice.paid_amount)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a payment method" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Invoice Dialog */}
      <Dialog 
        open={createInvoiceOpen || editInvoice !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setCreateInvoiceOpen(false);
            setEditInvoice(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editInvoice ? `Edit Invoice ${formatInvoiceId(editInvoice.id)}` : "Create New Invoice"}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <form onSubmit={handleSaveInvoice} className="space-y-6 py-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select 
                  name="client_id" 
                  value={selectedClient} 
                  onValueChange={handleClientChange}
                  required
                  disabled={!!editInvoice}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
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
              
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Invoice Date</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    defaultValue={editInvoice ? editInvoice.date : format(new Date(), "yyyy-MM-dd")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input 
                    id="due_date" 
                    name="due_date" 
                    type="date" 
                    defaultValue={editInvoice ? editInvoice.due_date : format(addDays(new Date(), 30), "yyyy-MM-dd")}
                    required
                  />
                </div>
              </div>
              
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  name="status" 
                  defaultValue={editInvoice ? editInvoice.status : "draft"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Associated Quotation or Trips */}
              {!editInvoice && selectedClient && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quotation_id">Associated Quotation (Optional)</Label>
                    <Select 
                      value={selectedQuotation || "_none"} 
                      onValueChange={handleQuotationChange}
                      disabled={quotationsLoading || selectedTrips.length > 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a quotation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">None</SelectItem>
                        {quotations?.map((quotation) => (
                          <SelectItem key={quotation.id} value={quotation.id}>
                            QUO-{quotation.id.substring(0, 8).toUpperCase()} ({formatDate(quotation.date)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {quotationsLoading && <p className="text-xs text-muted-foreground">Loading quotations...</p>}
                    {quotationsError && <p className="text-xs text-red-500">Error loading quotations</p>}
                  </div>
                  
                  {!selectedQuotation && (
                    <div className="space-y-2">
                      <Label>Associated Trips (Optional)</Label>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Driver</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tripsLoading ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                  Loading trips...
                                </TableCell>
                              </TableRow>
                            ) : availableTrips && availableTrips.length > 0 ? (
                              availableTrips.map((trip) => (
                                <TableRow key={trip.id}>
                                  <TableCell>
                                    <input
                                      type="checkbox"
                                      checked={selectedTrips.includes(trip.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTrips([...selectedTrips, trip.id]);
                                        } else {
                                          setSelectedTrips(selectedTrips.filter(id => id !== trip.id));
                                        }
                                      }}
                                      disabled={!!selectedQuotation}
                                    />
                                  </TableCell>
                                  <TableCell>{formatDate(trip.date)}</TableCell>
                                  <TableCell>{formatTripType(trip.type)}</TableCell>
                                  <TableCell>{trip.driver_name}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(trip.amount)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                  No uninvoiced trips available for this client
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {tripsError && <p className="text-xs text-red-500">Error loading trips</p>}
                    </div>
                  )}
                </div>
              )}
              
              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Invoice Items</Label>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={addItem}
                    disabled={!!selectedQuotation || selectedTrips.length > 0}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-full">Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => {
                                const updatedItems = [...invoiceItems];
                                updatedItems[index].description = e.target.value;
                                setInvoiceItems(updatedItems);
                              }}
                              disabled={!!selectedQuotation || selectedTrips.length > 0}
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              className="text-right w-20"
                              value={item.quantity}
                              onChange={(e) => {
                                const quantity = parseInt(e.target.value) || 0;
                                updateItemAmount(index, quantity, item.unit_price);
                              }}
                              disabled={!!selectedQuotation || selectedTrips.length > 0}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="text-right w-28"
                              value={item.unit_price}
                              onChange={(e) => {
                                const unitPrice = parseFloat(e.target.value) || 0;
                                updateItemAmount(index, item.quantity, unitPrice);
                              }}
                              disabled={!!selectedQuotation || selectedTrips.length > 0}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>
                            {invoiceItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                                disabled={!!selectedQuotation || selectedTrips.length > 0}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={3} className="pl-4 pr-4 py-2 text-right font-semibold">Total:</td>
                        <td className="pl-4 pr-4 py-2 text-right font-semibold">{formatCurrency(calculateTotal())}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  placeholder="Additional notes or payment instructions"
                  defaultValue={editInvoice?.notes || ""}
                  rows={3}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => {
                  setCreateInvoiceOpen(false);
                  setEditInvoice(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isFormDataLoading}>
                  {editInvoice ? "Update Invoice" : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Delete Invoice Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the invoice and remove its association with any trips.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
