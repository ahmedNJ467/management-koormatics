
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Mail, 
  FileText, 
  MoreHorizontal, 
  Copy, 
  Trash,
  Loader2,
  Receipt,
  ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogTitle, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InvoiceStatus, DisplayInvoice, Client, InvoiceItem, Invoice, Quotation } from "@/lib/types";

export default function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoiceToDelete, setInvoiceToDelete] = useState<DisplayInvoice | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<DisplayInvoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<DisplayInvoice | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Get invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', sortField, sortDirection],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(name, email),
          quotations:quotation_id(*)
        `)
        .order(sortField, { ascending: sortDirection === "asc" });
      
      if (error) throw error;

      // Map the data to match our Invoice interface
      return data.map(invoice => {
        const parsedItems = invoice.items as unknown as InvoiceItem[];
        return {
          id: invoice.id,
          date: invoice.date,
          due_date: invoice.due_date,
          client_id: invoice.client_id,
          client_name: invoice.clients?.name || 'Unknown Client',
          client_email: invoice.clients?.email,
          status: invoice.status as InvoiceStatus,
          total_amount: invoice.total_amount,
          paid_amount: invoice.paid_amount,
          payment_date: invoice.payment_date,
          payment_method: invoice.payment_method,
          notes: invoice.notes,
          items: parsedItems,
          quotation_id: invoice.quotation_id,
          quotation: invoice.quotations ? {
            ...invoice.quotations,
            items: invoice.quotations.items as unknown as QuotationItem[]
          } : undefined,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at
        } as DisplayInvoice;
      });
    },
  });

  // Define QuotationItem type explicitly here for type checking
  type QuotationItem = {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  };

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'invoices' }, 
        () => {
          // Force refresh the invoices data when any changes occur
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get clients for the form
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    },
  });

  // Get quotations for the form
  const { data: quotations } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('id, date, client_id, status, total_amount')
        .eq('status', 'approved')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Quotation[];
    },
  });

  const handleViewInvoice = useCallback((invoice: DisplayInvoice) => {
    setViewInvoice(invoice);
  }, []);

  const handleEditInvoice = useCallback((invoice: DisplayInvoice) => {
    setEditInvoice(invoice);
  }, []);

  const handleViewDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setViewInvoice(null);
    }
  }, []);

  const handleEditDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setEditInvoice(null);
    }
  }, []);

  const handleDeleteClick = useCallback((invoice: DisplayInvoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteAlert(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete the invoice.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteAlert(false);
      setInvoiceToDelete(null);
    }
  };

  const handleSendInvoice = async (invoice: DisplayInvoice) => {
    setIsSending(true);
    try {
      const client = clients?.find(c => c.id === invoice.client_id);
      
      if (!client?.email) {
        toast({
          title: "Error",
          description: "Client does not have an email address.",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }

      // Update invoice status to "sent"
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' as InvoiceStatus })
        .eq('id', invoice.id);
        
      if (error) throw error;

      toast({
        title: "Invoice marked as sent",
        description: `Invoice has been marked as sent to ${client.email}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Close the dialog if it was opened
      setViewInvoice(null);
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send the invoice",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDuplicateInvoice = async (invoice: DisplayInvoice) => {
    try {
      // Create a new invoice based on the existing one
      const newInvoice = {
        client_id: invoice.client_id,
        date: new Date().toISOString().split('T')[0], // Today's date
        due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // 30 days from now
        status: 'draft' as InvoiceStatus,
        total_amount: invoice.total_amount,
        paid_amount: 0,
        items: JSON.stringify(invoice.items), // Convert to JSON string
        notes: invoice.notes,
        quotation_id: invoice.quotation_id
      };
      
      const { error } = await supabase
        .from('invoices')
        .insert(newInvoice);
      
      if (error) throw error;
      
      toast({
        title: "Invoice duplicated",
        description: "A new draft invoice has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (error) {
      console.error("Error duplicating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the invoice.",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewInvoice = async () => {
    try {
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 30);
      
      const newInvoice = {
        client_id: "",
        date: today.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        status: 'draft' as InvoiceStatus,
        total_amount: 0,
        paid_amount: 0,
        items: JSON.stringify([]), // Empty array as JSON
      };
      
      const { data, error } = await supabase
        .from('invoices')
        .insert(newInvoice)
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Invoice created",
        description: "A new draft invoice has been created.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      // Open the newly created invoice in edit mode
      if (data && data.length > 0) {
        const newlyCreatedInvoice = {
          ...data[0],
          client_name: 'Select a client',
          items: [] as InvoiceItem[]
        } as DisplayInvoice;
        setEditInvoice(newlyCreatedInvoice);
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create the invoice.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (invoice: DisplayInvoice) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid' as InvoiceStatus,
          paid_amount: invoice.total_amount,
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', invoice.id);
      
      if (error) throw error;
      
      toast({
        title: "Invoice marked as paid",
        description: "The invoice has been marked as paid.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setViewInvoice(null);
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      toast({
        title: "Error",
        description: "Failed to mark the invoice as paid.",
        variant: "destructive",
      });
    }
  };

  const handleSaveInvoice = async (invoice: DisplayInvoice, formData: FormData) => {
    try {
      const clientId = formData.get('client_id') as string;
      const date = formData.get('date') as string;
      const dueDate = formData.get('due_date') as string;
      const quotationId = formData.get('quotation_id') as string || null;
      const notes = formData.get('notes') as string;
      
      // Get items from form
      const itemCount = parseInt(formData.get('item_count') as string);
      const items: InvoiceItem[] = [];
      
      let totalAmount = 0;
      
      for (let i = 0; i < itemCount; i++) {
        const description = formData.get(`item_description_${i}`) as string;
        const quantity = parseFloat(formData.get(`item_quantity_${i}`) as string);
        const unitPrice = parseFloat(formData.get(`item_unit_price_${i}`) as string);
        const amount = quantity * unitPrice;
        
        items.push({
          description,
          quantity,
          unit_price: unitPrice,
          amount
        });
        
        totalAmount += amount;
      }
      
      const updatedInvoice = {
        client_id: clientId,
        date,
        due_date: dueDate,
        notes,
        items: JSON.stringify(items), // Convert to JSON string
        total_amount: totalAmount,
        quotation_id: quotationId || null
      };
      
      const { error } = await supabase
        .from('invoices')
        .update(updatedInvoice)
        .eq('id', invoice.id);
      
      if (error) throw error;
      
      toast({
        title: "Invoice saved",
        description: "The invoice has been saved successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setEditInvoice(null);
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: "Failed to save the invoice.",
        variant: "destructive",
      });
    }
  };

  const handleCreateFromQuotation = async (quotationId: string) => {
    try {
      // Get the quotation first
      const { data: quotationData, error: quotationError } = await supabase
        .from('quotations')
        .select('*, clients:client_id(name, email)')
        .eq('id', quotationId)
        .single();
      
      if (quotationError) throw quotationError;
      
      if (!quotationData) {
        toast({
          title: "Error",
          description: "Quotation not found.",
          variant: "destructive"
        });
        return;
      }
      
      // Create new invoice from quotation
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 30);
      
      const newInvoice = {
        client_id: quotationData.client_id,
        date: today.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        status: 'draft' as InvoiceStatus,
        total_amount: quotationData.total_amount,
        paid_amount: 0,
        items: quotationData.items, // Pass as is (already JSON in DB)
        quotation_id: quotationId,
        notes: quotationData.notes
      };
      
      const { data, error } = await supabase
        .from('invoices')
        .insert(newInvoice)
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Invoice created",
        description: "A new invoice has been created from the quotation.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Open the newly created invoice in edit mode
      if (data && data.length > 0) {
        const newlyCreatedInvoice = {
          ...data[0],
          client_name: quotationData.clients.name,
          client_email: quotationData.clients.email,
          items: quotationData.items as unknown as InvoiceItem[]
        } as unknown as DisplayInvoice;
        setEditInvoice(newlyCreatedInvoice);
      }
    } catch (error) {
      console.error("Error creating invoice from quotation:", error);
      toast({
        title: "Error",
        description: "Failed to create the invoice from quotation.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Format the ID to show only the short version
  const formatId = (id: string) => {
    // Return just the first 8 characters of the UUID
    return id.substring(0, 8).toUpperCase();
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  // Only filter invoices if we have data and a search term/status filter
  const filteredInvoices = invoices 
    ? invoices.filter(invoice => {
        const matchesSearch = !searchTerm || 
          invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  // Calculate statistics
  const totalRevenue = (invoices || []).reduce((sum, invoice) => 
    invoice.status === 'paid' ? sum + invoice.paid_amount : sum, 0);
  
  const totalCollected = (invoices || []).reduce((sum, invoice) => 
    sum + invoice.paid_amount, 0);
    
  const totalInvoices = (invoices || []).length;
  
  const paidInvoices = (invoices || []).filter(invoice => 
    invoice.status === 'paid').length;
    
  const overdueInvoices = (invoices || []).filter(invoice => 
    invoice.status === 'overdue').length;
    
  const overduePercentage = totalInvoices > 0 
    ? Math.round((overdueInvoices / totalInvoices) * 100) 
    : 0;
    
  const draftInvoices = (invoices || []).filter(invoice => 
    invoice.status === 'draft').length;
    
  const draftPercentage = totalInvoices > 0 
    ? Math.round((draftInvoices / totalInvoices) * 100) 
    : 0;

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage client invoices</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateNewInvoice}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalCollected)} collected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidInvoices} paid
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overduePercentage}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {draftPercentage}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
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

      {!filteredInvoices || filteredInvoices.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Invoices Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? "No invoices match your search criteria" 
              : "Create an invoice to get started"}
          </p>
          <Button onClick={handleCreateNewInvoice}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 font-medium hover:no-underline" 
                    onClick={() => handleSort("id")}
                  >
                    ID <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 font-medium hover:no-underline" 
                    onClick={() => handleSort("date")}
                  >
                    Date <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 font-medium hover:no-underline" 
                    onClick={() => handleSort("due_date")}
                  >
                    Due Date <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <Button 
                    variant="ghost" 
                    className="p-0 font-medium hover:no-underline" 
                    onClick={() => handleSort("total_amount")}
                  >
                    Amount <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{formatId(invoice.id)}</TableCell>
                  <TableCell>{format(new Date(invoice.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{invoice.client_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.total_amount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.paid_amount)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <DropdownMenuItem 
                            onClick={() => handleMarkAsPaid(invoice)}
                          >
                            <Receipt className="mr-2 h-4 w-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        {invoice.status !== 'sent' && invoice.status !== 'paid' && (
                          <DropdownMenuItem 
                            onClick={() => handleSendInvoice(invoice)}
                            disabled={isSending}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Mark as Sent
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDuplicateInvoice(invoice)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(invoice)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Approved Quotations section */}
      {quotations && quotations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Approved Quotations</h3>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">{formatId(quotation.id)}</TableCell>
                    <TableCell>{format(new Date(quotation.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{formatCurrency(quotation.total_amount)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCreateFromQuotation(quotation.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Invoice
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Invoice view dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={handleViewDialogClose}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Invoice Details</DialogTitle>
          {viewInvoice && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-semibold">#{formatId(viewInvoice.id)}</h3>
                  <p className="text-muted-foreground">
                    Created: {format(new Date(viewInvoice.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(viewInvoice.status)}`}>
                  {viewInvoice.status.charAt(0).toUpperCase() + viewInvoice.status.slice(1)}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Client</h4>
                  <p>{viewInvoice.client_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Due Date</h4>
                  <p>{format(new Date(viewInvoice.due_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              {viewInvoice.notes && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-muted-foreground">{viewInvoice.notes}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                <div className="rounded-md border">
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
                          <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Total:</TableCell>
                        <TableCell className="text-right font-bold">${viewInvoice.total_amount.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setViewInvoice(null)}>
                  Close
                </Button>
                {viewInvoice.status !== 'paid' && viewInvoice.status !== 'cancelled' && (
                  <Button onClick={() => handleMarkAsPaid(viewInvoice)}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
                {viewInvoice.status !== 'sent' && viewInvoice.status !== 'paid' && (
                  <Button 
                    onClick={() => handleSendInvoice(viewInvoice)} 
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Mark as Sent
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice edit dialog */}
      <Dialog open={!!editInvoice} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Edit Invoice</DialogTitle>
          {editInvoice && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveInvoice(editInvoice, new FormData(e.currentTarget));
            }}>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Client</Label>
                    <Select name="client_id" defaultValue={editInvoice.client_id} required>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="quotation_id">Based on Quotation (Optional)</Label>
                    <Select 
                      name="quotation_id" 
                      defaultValue={editInvoice.quotation_id || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a quotation (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {quotations?.map((quotation) => (
                          <SelectItem key={quotation.id} value={quotation.id}>
                            #{formatId(quotation.id)} - ${quotation.total_amount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Invoice Date</Label>
                    <Input 
                      type="date" 
                      name="date" 
                      defaultValue={editInvoice.date} 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input 
                      type="date" 
                      name="due_date" 
                      defaultValue={editInvoice.due_date} 
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input 
                    name="notes" 
                    defaultValue={editInvoice.notes || ""} 
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Items</Label>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">Quantity</TableHead>
                          <TableHead className="w-[150px]">Unit Price</TableHead>
                          <TableHead className="w-[150px]">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(editInvoice.items || []).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input 
                                name={`item_description_${index}`} 
                                defaultValue={item.description} 
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                name={`item_quantity_${index}`} 
                                defaultValue={item.quantity} 
                                min="0.01" 
                                step="0.01" 
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                name={`item_unit_price_${index}`} 
                                defaultValue={item.unit_price} 
                                min="0.01" 
                                step="0.01" 
                                required
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${item.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Allow for a new item if needed */}
                        {(editInvoice.items || []).length === 0 && (
                          <TableRow>
                            <TableCell>
                              <Input 
                                name="item_description_0" 
                                placeholder="Description" 
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                name="item_quantity_0" 
                                placeholder="Qty" 
                                min="0.01" 
                                step="0.01" 
                                required
                                defaultValue="1"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                name="item_unit_price_0" 
                                placeholder="Price" 
                                min="0.01" 
                                step="0.01" 
                                required
                                defaultValue="0"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              $0.00
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <input 
                    type="hidden" 
                    name="item_count" 
                    value={Math.max((editInvoice.items || []).length, 1)} 
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditInvoice(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm deletion dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the invoice. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
