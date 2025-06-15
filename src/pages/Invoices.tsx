import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isAfter, isBefore, parseISO } from "date-fns";
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
  Json,
  prepareForSupabase,
  convertToInvoice
} from "@/lib/types/invoice";
import { DisplayTrip } from "@/lib/types/trip";
import { Client } from "@/lib/types/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { pdfConfig } from "@/components/reports/utils/pdf/pdfStyles";

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

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          *,
          clients:client_id(name, email, address, phone)
        `)
        .order("date", { ascending: false });

      if (invoicesError) throw invoicesError;

      const invoicesWithTrips = await Promise.all(
        invoicesData.map(async (invoice) => {
          const { data: tripsData, error: tripsError } = await supabase
            .from("trips")
            .select(`*`)
            .eq("invoice_id", invoice.id);

          if (tripsError) console.error("Error fetching trips:", tripsError);
          
          const tripsForInvoice = tripsData ? tripsData.map((trip: any) => ({
            ...trip,
            type: trip.service_type || 'other',
            status: 'scheduled',
            client_name: invoice.clients?.name || "Unknown Client",
            vehicle_details: "Vehicle details not available",
            driver_name: "Driver not assigned",
          } as DisplayTrip)) : [];
          
          const displayInvoice = convertToInvoice(invoice);
          displayInvoice.trips = tripsForInvoice;
          
          return displayInvoice;
        })
      );

      return invoicesWithTrips;
    },
  });

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

  const { data: availableTrips, refetch: refetchAvailableTrips } = useQuery({
    queryKey: ["availableTrips", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];

      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email, address, phone),
          vehicles:vehicle_id(make, model, registration, type),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .eq("client_id", selectedClientId)
        .is("invoice_id", null)
        .in("service_type", ["airport_pickup", "airport_dropoff", "full_day", "one_way_transfer", "round_trip", "security_escort"])
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((trip: any) => ({
        ...trip,
        type: trip.service_type || 'other',
        status: 'scheduled',
        client_name: trip.clients?.name || "Unknown Client",
        vehicle_details: `${trip.vehicles?.make || ""} ${trip.vehicles?.model || ""} (${trip.vehicles?.registration || ""})`,
        vehicle_type: trip.vehicles?.type || null,
        driver_name: trip.drivers?.name || "Unknown Driver",
      } as DisplayTrip & { vehicle_type: string | null }));
    },
    enabled: !!selectedClientId,
  });

  useEffect(() => {
    if (selectedClientId) {
      refetchAvailableTrips();
      setSelectedTrips([]);
    }
  }, [selectedClientId, refetchAvailableTrips]);

  useEffect(() => {
    if (invoiceToMarkPaid) {
      const remainingAmount = invoiceToMarkPaid.total_amount - (invoiceToMarkPaid.paid_amount || 0);
      setPaymentAmount(remainingAmount);
    }
  }, [invoiceToMarkPaid]);

  useEffect(() => {
    if (editInvoice) {
      setInvoiceItems(editInvoice.items.length > 0 ? editInvoice.items : [
        { description: "", quantity: 1, unit_price: 0, amount: 0 }
      ]);
      setSelectedClientId(editInvoice.client_id);
    } else if (createInvoiceOpen) {
      setInvoiceItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
      setSelectedClientId("");
      setSelectedTrips([]);
    }
  }, [editInvoice, createInvoiceOpen]);

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

  const calculateTotal = (items: InvoiceItem[]): number => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === "quantity" || field === "unit_price") {
      const quantity = field === "quantity" ? value : updatedItems[index].quantity;
      const unitPrice = field === "unit_price" ? value : updatedItems[index].unit_price;
      updatedItems[index].amount = quantity * unitPrice;
    }
    
    setInvoiceItems(updatedItems);
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length <= 1) return;
    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updatedItems);
  };

  const handleSaveInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const totalAmount = calculateTotal(invoiceItems);
    
    try {
      if (editInvoice) {
        const invoiceData = {
          client_id: formData.get("client_id") as string,
          date: formData.get("date") as string,
          due_date: formData.get("due_date") as string,
          status: formData.get("status") as InvoiceStatus,
          items: prepareForSupabase(invoiceItems),
          total_amount: totalAmount,
          paid_amount: editInvoice.paid_amount,
          notes: formData.get("notes") as string || null,
          updated_at: new Date().toISOString(),
        };
        
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", editInvoice.id);
        
        if (error) throw error;

        toast({
          title: "Invoice updated",
          description: "Invoice details have been updated successfully",
        });
        
        setEditInvoice(null);
      } else {
        const invoiceData = {
          client_id: formData.get("client_id") as string,
          date: formData.get("date") as string,
          due_date: formData.get("due_date") as string,
          status: formData.get("status") as InvoiceStatus || "draft",
          items: prepareForSupabase(invoiceItems),
          total_amount: totalAmount,
          paid_amount: 0,
          notes: formData.get("notes") as string || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const { data, error } = await supabase
          .from("invoices")
          .insert(invoiceData)
          .select();
        
        if (error) throw error;

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

  const deleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    try {
      const { error: tripUpdateError } = await supabase
        .from("trips")
        .update({ invoice_id: null })
        .eq("invoice_id", invoiceToDelete);
      
      if (tripUpdateError) {
        console.error("Error unlinking trips:", tripUpdateError);
      }
      
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

  const formatStatus = (status: InvoiceStatus | undefined): string => {
    if (!status) return "Unknown";
    
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
  
  const getStatusColor = (status: InvoiceStatus | undefined): string => {
    if (!status) return "bg-gray-100 text-gray-700";
    
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

  const formatInvoiceId = (id: string): string => {
    return id.substring(0, 8).toUpperCase();
  };

  const isInvoiceOverdue = (invoice: Invoice): boolean => {
    return (
      invoice.status === "sent" &&
      isBefore(parseISO(invoice.due_date), new Date())
    );
  };
  
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

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = 
      searchTerm === "" ||
      invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatInvoiceId(invoice.id).includes(searchTerm.toUpperCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const generateInvoicePDF = (invoice: DisplayInvoice) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const primaryColor = '#000000';
    const secondaryColor = '#555555';
    const headerBgColor = '#F5F5F5';

    doc.setFont('helvetica');

    // --- HEADER ---
    const logoPath = '/lovable-uploads/6996f29f-4f5b-4a22-ba41-51dc5c98afb7.png';
    const logoAspectRatio = 123 / 622;
    const logoWidth = 50;
    const logoHeight = logoWidth * logoAspectRatio;
    try {
      doc.addImage(logoPath, 'PNG', margin, 15, logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo:", e);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("PBG | MOVCON DEPT.", margin, 25);
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    const companyInfoText = [
        'PBG | MOVCON DEPT.',
        'UNOCA Compound, Garowe, Puntland, Somalia',
        '+252 (0) 907-790101',
        'pbg.movcon@pbg-som.com',
        'www.pbg-som.com'
    ];
    doc.text(companyInfoText, margin, 15 + logoHeight + 5);

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text("INVOICE", pageW - margin, 25, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    let yPosHeader = 35;
    doc.text(`Invoice #: ${formatInvoiceId(invoice.id)}`, pageW - margin, yPosHeader, { align: 'right' });
    yPosHeader += 6;
    doc.text(`Date: ${formatDate(invoice.date)}`, pageW - margin, yPosHeader, { align: 'right' });
    yPosHeader += 6;
    doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageW - margin, yPosHeader, { align: 'right' });
    
    let yPos = 15 + logoHeight + 5 + (companyInfoText.length * 5) + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text("BILL TO", margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    yPos += 5;
    doc.text(invoice.client_name, margin, yPos);
    yPos += 5;
    if (invoice.client_address) {
        const addressLines = doc.splitTextToSize(invoice.client_address, 80);
        doc.text(addressLines, margin, yPos);
        yPos += (doc.getTextDimensions(addressLines).h);
    }
    if (invoice.client_email) {
        doc.text(invoice.client_email, margin, yPos);
        yPos += 5;
    }
    if (invoice.client_phone) {
        doc.text(invoice.client_phone, margin, yPos);
    }
    
    const tableStartY = Math.max(yPos, 70) + 15;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: invoice.items.map(item => [
        item.description,
        item.quantity,
        formatCurrency(item.unit_price),
        formatCurrency(item.amount)
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor, 
        textColor: '#FFFFFF',
        fontStyle: 'bold'
      },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      alternateRowStyles: {
        fillColor: headerBgColor
      },
      didDrawPage: function (data) {
        const pageNumber = (doc as any).internal.getCurrentPageInfo().pageNumber;
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor);
        doc.text('Thank you for your business!', margin, doc.internal.pageSize.height - 10);
        doc.text(`Page ${pageNumber} of ${pageCount}`, pageW - margin, doc.internal.pageSize.height - 10, { align: 'right' });
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    let yPosTotals = finalY + 10;
    const subtotal = invoice.total_amount;
    const taxRate = 0.05;
    const taxAmount = subtotal * taxRate;
    const totalWithTax = subtotal + taxAmount;
    const balanceDue = totalWithTax - (invoice.paid_amount || 0);
    const totalCol1 = pageW - margin - 50;
    const totalCol2 = pageW - margin;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    
    doc.text('Subtotal:', totalCol1, yPosTotals, { align: 'right' });
    doc.text(formatCurrency(subtotal), totalCol2, yPosTotals, { align: 'right' });
    yPosTotals += 7;
    
    doc.text('Tax (5%):', totalCol1, yPosTotals, { align: 'right' });
    doc.text(formatCurrency(taxAmount), totalCol2, yPosTotals, { align: 'right' });
    yPosTotals += 7;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('Total:', totalCol1, yPosTotals, { align: 'right' });
    doc.text(formatCurrency(totalWithTax), totalCol2, yPosTotals, { align: 'right' });
    yPosTotals += 7;
    
    if (invoice.paid_amount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(secondaryColor);
      doc.text('Amount Paid:', totalCol1, yPosTotals, { align: 'right' });
      doc.text(`-${formatCurrency(invoice.paid_amount)}`, totalCol2, yPosTotals, { align: 'right' });
      yPosTotals += 7;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('Balance Due:', totalCol1, yPosTotals, { align: 'right' });
      doc.text(formatCurrency(balanceDue), totalCol2, yPosTotals, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('Balance Due:', totalCol1, yPosTotals, { align: 'right' });
      doc.text(formatCurrency(balanceDue), totalCol2, yPosTotals, { align: 'right' });
    }
    
    yPosTotals += 15;

    if (invoice.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('Notes:', margin, yPosTotals);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(secondaryColor);
      const splitNotes = doc.splitTextToSize(invoice.notes, pageW - (margin * 2));
      doc.text(splitNotes, margin, yPosTotals + 5);
    }
    
    doc.save(`Invoice-${formatInvoiceId(invoice.id)}.pdf`);

    toast({
      title: "Invoice PDF Generated",
      description: "Your invoice has been downloaded.",
    });
  };

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

      <div className="border rounded-lg bg-card">
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
                              const tripDate = format(new Date(trip.date), "yyyy-MM-dd");
                              
                              // Format vehicle type properly
                              const vehicleType = (trip as any).vehicle_type;
                              const vehicleTypeText = vehicleType === 'armoured'
                                ? '(Armoured Vehicle)'
                                : vehicleType === 'soft_skin'
                                  ? '(Soft Skin Vehicle)'
                                  : '';
                              
                              const description = [
                                `Trip from ${trip.pickup_location || 'N/A'} to ${trip.dropoff_location || 'N/A'} on ${tripDate}`,
                                vehicleTypeText
                              ].filter(Boolean).join(' ');
                              
                              if (checked) {
                                setSelectedTrips([...selectedTrips, trip.id]);
                                
                                const amount = trip.amount || 0;
                                
                                setInvoiceItems(currentItems => {
                                  const newItems = currentItems.filter(item => item.description || item.amount);
                                  return [
                                    ...newItems,
                                    { 
                                      description, 
                                      quantity: 1, 
                                      unit_price: amount, 
                                      amount 
                                    }
                                  ];
                                });
                              } else {
                                setSelectedTrips(selectedTrips.filter(id => id !== trip.id));
                                
                                setInvoiceItems(currentItems => {
                                  const updatedItems = currentItems.filter(
                                    item => item.description !== description
                                  );

                                  if (updatedItems.length === 0) {
                                    return [{ description: "", quantity: 1, unit_price: 0, amount: 0 }];
                                  }
                                  
                                  return updatedItems;
                                });
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
                              {/* Show vehicle type in the trip display */}
                              {(trip as any).vehicle_type && (
                                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                                  {(trip as any).vehicle_type === 'armoured' ? 'Armoured' : 'Soft Skin'}
                                </span>
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
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) => updateInvoiceItem(index, "unit_price", parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="flex h-10 items-center px-3 border rounded-md bg-muted">
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {invoiceItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInvoiceItem(index)}
                            className="h-8 w-8"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-4">
                  <div className="w-[200px] space-y-1">
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
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea 
                  id="notes"
                  name="notes"
                  placeholder="Enter any additional notes for this invoice"
                  defaultValue={editInvoice?.notes || ""}
                  rows={3}
                />
              </div>

              {editInvoice && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    name="status" 
                    defaultValue={editInvoice.status}
                  >
                    <SelectTrigger id="status">
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
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setCreateInvoiceOpen(false);
                  setEditInvoice(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editInvoice ? "Update Invoice" : "Create Invoice"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewInvoice} onOpenChange={(open) => !open && setViewInvoice(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice && formatInvoiceId(viewInvoice.id)}</DialogTitle>
            <DialogDescription>
              {viewInvoice && (
                <Badge className={getStatusColor(viewInvoice.status)}>
                  {formatStatus(viewInvoice.status)}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {viewInvoice && (
            <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Client Details</h3>
                    <div className="text-sm">
                      <p className="font-medium">{viewInvoice.client_name}</p>
                      {viewInvoice.client_address && (
                        <p className="text-muted-foreground">{viewInvoice.client_address}</p>
                      )}
                      {viewInvoice.client_email && (
                        <p className="text-muted-foreground">{viewInvoice.client_email}</p>
                      )}
                      {viewInvoice.client_phone && (
                        <p className="text-muted-foreground">{viewInvoice.client_phone}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Invoice Details</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoice Date:</span>
                        <span>{formatDate(viewInvoice.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>{formatDate(viewInvoice.due_date)}</span>
                      </div>
                      {viewInvoice.payment_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Date:</span>
                          <span>{formatDate(viewInvoice.payment_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Invoice Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
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
                        <TableCell className="text-right font-medium">
                          {formatCurrency(viewInvoice.total_amount)}
                        </TableCell>
                      </TableRow>
                      {viewInvoice.paid_amount > 0 && (
                        <>
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">
                              Paid
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {formatCurrency(viewInvoice.paid_amount)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">
                              Balance Due
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(viewInvoice.total_amount - viewInvoice.paid_amount)}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableFooter>
                  </Table>
                </div>

                {viewInvoice.notes && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Notes</h3>
                    <div className="p-3 bg-gray-50 rounded-md text-sm">
                      {viewInvoice.notes.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {viewInvoice.trips && viewInvoice.trips.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Related Trips</h3>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewInvoice.trips.map((trip) => (
                            <TableRow key={trip.id}>
                              <TableCell>{formatDate(trip.date)}</TableCell>
                              <TableCell>{trip.type}</TableCell>
                              <TableCell>
                                {trip.pickup_location && trip.dropoff_location
                                  ? `${trip.pickup_location} to ${trip.dropoff_location}`
                                  : trip.pickup_location || trip.dropoff_location || "N/A"}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(trip.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="gap-2">
            <div className="flex gap-2 flex-1">
              {viewInvoice && viewInvoice.status !== "paid" && viewInvoice.status !== "cancelled" && (
                <Button
                  onClick={() => {
                    setInvoiceToMarkPaid(viewInvoice);
                    setPaymentDialogOpen(true);
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => generateInvoicePDF(viewInvoice!)}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              {viewInvoice && viewInvoice.status === "draft" && (
                <Button onClick={() => sendInvoiceByEmail(viewInvoice)}>
                  <Send className="mr-2 h-4 w-4" /> Send to Client
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {invoiceToMarkPaid && (
                <>Record payment for invoice {formatInvoiceId(invoiceToMarkPaid.id)}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="paymentAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                  className="pl-9"
                  required
                />
              </div>
              {invoiceToMarkPaid && (
                <div className="text-sm text-muted-foreground">
                  Balance due: {formatCurrency(invoiceToMarkPaid.total_amount - (invoiceToMarkPaid.paid_amount || 0))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <SelectTrigger id="paymentMethod">
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
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                placeholder="Add any notes about this payment"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>
              <Check className="mr-2 h-4 w-4" /> Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this invoice. Associated trips will be unlinked from this invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteInvoice} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
