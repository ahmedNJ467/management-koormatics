
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
  ArrowUpDown,
  FileCheck
} from "lucide-react";
import { format, isAfter } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InvoiceItem, InvoiceStatus, Client, DisplayInvoice, DisplayQuotation } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { addDays } from "date-fns";

export default function Invoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<DisplayInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<DisplayInvoice | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<DisplayInvoice | null>(null);
  const [markAsPaidDialogOpen, setMarkAsPaidDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [isSending, setIsSending] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Get invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients:client_id(name, email)
        `)
        .order(sortBy, { ascending: sortOrder === "asc" });
      
      if (error) throw error;

      // Check for overdue invoices and update status if needed
      const today = new Date();
      const updatedData = await Promise.all(data.map(async (invoice) => {
        if (invoice.status === 'sent' && isAfter(today, new Date(invoice.due_date))) {
          // Update the invoice status to overdue
          await supabase
            .from('invoices')
            .update({ status: 'overdue' as InvoiceStatus })
            .eq('id', invoice.id);
          
          return {
            ...invoice,
            status: 'overdue' as InvoiceStatus
          };
        }
        return invoice;
      }));

      // Map the data to match our Invoice interface
      return updatedData.map(invoice => ({
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
        items: (invoice.items as unknown) as InvoiceItem[],
        quotation_id: invoice.quotation_id,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at
      })) as DisplayInvoice[];
    },
  });

  useEffect(() => {
    // Refresh invoices when sort changes
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  }, [sortBy, sortOrder, queryClient]);

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

  // Get approved quotations for creating invoices
  const { data: approvedQuotations } = useQuery({
    queryKey: ['approved-quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          clients:client_id(name, email)
        `)
        .eq('status', 'approved')
        .order('date', { ascending: false });
      
      if (error) throw error;

      return data.map(quote => ({
        id: quote.id,
        date: quote.date,
        client_id: quote.client_id,
        client_name: quote.clients?.name || 'Unknown Client',
        status: quote.status,
        total_amount: quote.total_amount,
        items: quote.items,
      })) as DisplayQuotation[];
    },
  });

  const handleViewInvoice = useCallback((invoice: DisplayInvoice) => {
    setViewInvoice(invoice);
  }, []);

  const handleViewDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setViewInvoice(null);
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

      // Mock sending the invoice - in a real app, this would send an email
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update invoice status to "sent"
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' as InvoiceStatus })
        .eq('id', invoice.id);
        
      if (error) throw error;

      toast({
        title: "Invoice sent",
        description: `The invoice has been sent to ${client.email}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
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

  const handleMarkAsPaid = useCallback((invoice: DisplayInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.total_amount.toString());
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod("bank_transfer");
    setMarkAsPaidDialogOpen(true);
  }, []);

  const handlePaymentConfirm = async () => {
    if (!selectedInvoice) return;
    
    setIsPaying(true);
    try {
      const amount = parseFloat(paymentAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid payment amount");
      }
      
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid' as InvoiceStatus,
          paid_amount: amount,
          payment_date: paymentDate,
          payment_method: paymentMethod
        })
        .eq('id', selectedInvoice.id);
        
      if (error) throw error;
      
      toast({
        title: "Payment recorded",
        description: `Payment of $${amount.toFixed(2)} has been recorded.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setMarkAsPaidDialogOpen(false);
      setSelectedInvoice(null);
      if (viewInvoice && viewInvoice.id === selectedInvoice.id) {
        setViewInvoice(null);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleDuplicateInvoice = async (invoice: DisplayInvoice) => {
    try {
      // Create a new invoice based on the existing one
      const newInvoice = {
        client_id: invoice.client_id,
        date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        status: 'draft' as InvoiceStatus,
        total_amount: invoice.total_amount,
        notes: invoice.notes,
        items: invoice.items as any
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

  const handleCreateInvoice = useCallback(() => {
    setSelectedInvoice(null);
    setSelectedQuotation(null);
    setInvoiceFormOpen(true);
  }, []);

  const handleCreateFromQuotation = useCallback((quotation: DisplayQuotation) => {
    setSelectedQuotation(quotation.id);
    setInvoiceFormOpen(true);
  }, []);

  const handleInvoiceFormClose = (open: boolean) => {
    setInvoiceFormOpen(open);
    if (!open) {
      setSelectedInvoice(null);
      setSelectedQuotation(null);
    }
  };

  const handleEditInvoice = useCallback((invoice: DisplayInvoice) => {
    setSelectedInvoice(invoice);
    setInvoiceFormOpen(true);
  }, []);

  const handleSaveInvoice = async (formData: any) => {
    try {
      if (selectedInvoice) {
        // Update existing invoice
        const { error } = await supabase
          .from('invoices')
          .update(formData)
          .eq('id', selectedInvoice.id);
          
        if (error) throw error;
        
        toast({
          title: "Invoice updated",
          description: "The invoice has been updated successfully."
        });
      } else {
        // Create new invoice
        const { error } = await supabase
          .from('invoices')
          .insert(formData);
          
        if (error) throw error;
        
        toast({
          title: "Invoice created",
          description: "New invoice has been created successfully."
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setInvoiceFormOpen(false);
      setSelectedInvoice(null);
      setSelectedQuotation(null);
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save invoice",
        variant: "destructive"
      });
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column and default to descending
      setSortBy(column);
      setSortOrder("desc");
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format the ID to show only the short version
  const formatId = (id: string) => {
    // Return just the first 8 characters of the UUID
    return id.substring(0, 8).toUpperCase();
  };

  // Only filter invoices if we have data and a search term
  const filteredInvoices = searchTerm && invoices 
    ? invoices.filter(invoice => 
        invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : invoices;

  // Calculate summary statistics
  const invoiceStats = {
    total: invoices?.length || 0,
    paid: invoices?.filter(inv => inv.status === 'paid').length || 0,
    overdue: invoices?.filter(inv => inv.status === 'overdue').length || 0,
    draft: invoices?.filter(inv => inv.status === 'draft').length || 0,
    totalAmount: invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0,
    paidAmount: invoices?.filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage client invoices</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateInvoice}>
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
            <div className="text-2xl font-bold">{formatCurrency(invoiceStats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(invoiceStats.paidAmount)} collected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoiceStats.paid} paid
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceStats.overdue}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((invoiceStats.overdue / invoiceStats.total) * 100) || 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceStats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((invoiceStats.draft / invoiceStats.total) * 100) || 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 mb-4"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                ID {sortBy === "id" && (
                  <ArrowUpDown className="inline-block h-4 w-4 ml-1" />
                )}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                Date {sortBy === "date" && (
                  <ArrowUpDown className="inline-block h-4 w-4 ml-1" />
                )}
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                Status {sortBy === "status" && (
                  <ArrowUpDown className="inline-block h-4 w-4 ml-1" />
                )}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("due_date")}>
                Due Date {sortBy === "due_date" && (
                  <ArrowUpDown className="inline-block h-4 w-4 ml-1" />
                )}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("total_amount")}>
                Amount {sortBy === "total_amount" && (
                  <ArrowUpDown className="inline-block h-4 w-4 ml-1" />
                )}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredInvoices || filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  {searchTerm ? "No matching invoices found." : "No invoices found. Create your first invoice!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{formatId(invoice.id)}</TableCell>
                  <TableCell>{format(new Date(invoice.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{invoice.client_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
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
                        <DropdownMenuItem 
                          onClick={() => handleEditInvoice(invoice)}
                          disabled={invoice.status === 'paid'}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSendInvoice(invoice)}
                          disabled={invoice.status !== 'draft'}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send to Client
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleMarkAsPaid(invoice)}
                          disabled={invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'draft'}
                        >
                          <FileCheck className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Convert From Quotation Section */}
      {approvedQuotations && approvedQuotations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-2">Approved Quotations Ready for Invoicing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedQuotations.map(quotation => (
              <Card key={quotation.id} className="hover:border-primary cursor-pointer" onClick={() => handleCreateFromQuotation(quotation)}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-md">
                    #{formatId(quotation.id)}
                  </CardTitle>
                  <CardDescription>
                    {quotation.client_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{formatCurrency(quotation.total_amount)}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(quotation.date), 'MMM d, yyyy')}</p>
                  <Button className="mt-4 w-full" size="sm" variant="outline">
                    <Receipt className="mr-2 h-4 w-4" /> Convert to Invoice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Invoice View Dialog */}
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
              
              {viewInvoice.status === 'paid' && (
                <div className="grid md:grid-cols-3 gap-6 p-4 bg-green-50 rounded-md">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Payment Date</h4>
                    <p>{viewInvoice.payment_date ? format(new Date(viewInvoice.payment_date), 'MMM d, yyyy') : 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Amount Paid</h4>
                    <p>{formatCurrency(viewInvoice.paid_amount || 0)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Payment Method</h4>
                    <p>{viewInvoice.payment_method ? viewInvoice.payment_method.replace('_', ' ').toUpperCase() : 'N/A'}</p>
                  </div>
                </div>
              )}
              
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
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Total:</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(viewInvoice.total_amount)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setViewInvoice(null)}>
                  Close
                </Button>
                {viewInvoice.status === 'draft' && (
                  <Button onClick={() => handleSendInvoice(viewInvoice)}>
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send to Client
                      </>
                    )}
                  </Button>
                )}
                {(viewInvoice.status === 'sent' || viewInvoice.status === 'overdue') && (
                  <Button onClick={() => handleMarkAsPaid(viewInvoice)}>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={markAsPaidDialogOpen} onOpenChange={setMarkAsPaidDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Record Payment</DialogTitle>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Payment Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
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
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setMarkAsPaidDialogOpen(false)}
              disabled={isPaying}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentConfirm}
              disabled={isPaying}
            >
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Form Dialog - Simplified for this example */}
      <Dialog open={invoiceFormOpen} onOpenChange={handleInvoiceFormClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>{selectedInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          {/* Simplified form for this example */}
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select defaultValue={selectedInvoice?.client_id || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Invoice Date</Label>
                <Input
                  id="date"
                  type="date"
                  defaultValue={selectedInvoice?.date || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  defaultValue={selectedInvoice?.due_date || format(addDays(new Date(), 30), 'yyyy-MM-dd')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={selectedInvoice?.status || "draft"}>
                  <SelectTrigger>
                    <SelectValue />
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any notes for this invoice..."
                defaultValue={selectedInvoice?.notes || ""}
              />
            </div>
            
            {/* This would typically be a dynamic list of items */}
            <div>
              <Label>Items</Label>
              <div className="border rounded-lg p-4 mt-2">
                <p className="text-muted-foreground text-sm">
                  {selectedQuotation ? 
                    "Items will be imported from the selected quotation." :
                    selectedInvoice ?
                    `${selectedInvoice.items.length} items with a total of ${formatCurrency(selectedInvoice.total_amount)}` :
                    "Add items to this invoice."
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setInvoiceFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // In a real implementation, you'd collect all form values here
              const mockFormData = {
                client_id: selectedInvoice?.client_id || clients?.[0]?.id || "",
                date: selectedInvoice?.date || format(new Date(), 'yyyy-MM-dd'),
                due_date: selectedInvoice?.due_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
                status: "draft",
                total_amount: selectedInvoice?.total_amount || 100,
                items: selectedInvoice?.items || [
                  { description: "Sample Item", quantity: 1, unit_price: 100, amount: 100 }
                ],
                notes: selectedInvoice?.notes || "",
                quotation_id: selectedQuotation || null
              };
              handleSaveInvoice(mockFormData);
            }}>
              Save Invoice
            </Button>
          </div>
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
