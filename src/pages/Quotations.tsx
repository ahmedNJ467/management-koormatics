
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
  Download
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuotationFormDialog } from "@/components/quotation-form-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTitle, DialogContent, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { QuotationItem, QuotationStatus, Client, DisplayQuotation } from "@/lib/types";
import { TableFooter } from "@/components/ui/table";
import { calculateTotal, formatCurrency } from "@/lib/invoice-helpers";
import { generateQuotationPDF } from "@/lib/quotation-helpers";

export default function Quotations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<DisplayQuotation | null>(null);
  const [quotationToDelete, setQuotationToDelete] = useState<DisplayQuotation | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [viewQuotation, setViewQuotation] = useState<DisplayQuotation | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Get quotations
  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          clients:client_id(name, email, address, phone)
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;

      // Map the data to match our Quotation interface
      return data.map((quote: any) => ({
        id: quote.id,
        date: quote.date,
        client_id: quote.client_id,
        client_name: quote.clients?.name || 'Unknown Client',
        client_email: quote.clients?.email,
        client_address: quote.clients?.address,
        client_phone: quote.clients?.phone,
        status: quote.status as QuotationStatus,
        total_amount: quote.total_amount,
        valid_until: quote.valid_until,
        notes: quote.notes,
        items: (quote.items as unknown) as QuotationItem[],
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        vat_percentage: quote.vat_percentage,
        discount_percentage: quote.discount_percentage,
      })) as DisplayQuotation[];
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('quotations-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'quotations' }, 
        () => {
          // Force refresh the quotations data when any changes occur
          queryClient.invalidateQueries({ queryKey: ["quotations"] });
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

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open);
    // When dialog closes, reset the selected quotation
    if (!open) {
      setSelectedQuotation(null);
    }
  }, []);

  const handleQuotationClick = useCallback((quotation: DisplayQuotation) => {
    setSelectedQuotation(quotation);
    setFormOpen(true);
  }, []);

  const handleViewQuotation = useCallback((quotation: DisplayQuotation) => {
    setViewQuotation(quotation);
  }, []);

  const handleViewDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setViewQuotation(null);
    }
  }, []);

  const handleDeleteClick = useCallback((quotation: DisplayQuotation) => {
    setQuotationToDelete(quotation);
    setShowDeleteAlert(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!quotationToDelete) return;
    
    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', quotationToDelete.id);
      
      if (error) throw error;
      
      toast({
        title: "Quotation deleted",
        description: "The quotation has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to delete the quotation.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteAlert(false);
      setQuotationToDelete(null);
    }
  };

  const handleSendQuotation = async (quotation: DisplayQuotation) => {
    setIsSending(true);
    try {
      const client = clients?.find(c => c.id === quotation.client_id);
      
      if (!client?.email) {
        toast({
          title: "Error",
          description: "Client does not have an email address.",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }

      // Send the quotation via the edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quotation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          quotationId: quotation.id,
          clientEmail: client.email,
          clientName: client.name
        })
      });
      
      // Check if response is JSON before parsing
      let result;
      try {
        result = await response.json();
      } catch (error) {
        console.error("Error parsing response:", error);
        throw new Error("Failed to parse response from server");
      }
      
      if (!response.ok) {
        throw new Error(result?.error || "Failed to send quotation");
      }

      // Update quotation status to "sent"
      const { error } = await supabase
        .from('quotations')
        .update({ status: 'sent' as QuotationStatus })
        .eq('id', quotation.id);
        
      if (error) throw error;

      toast({
        title: "Quotation sent",
        description: `The quotation has been sent to ${client.email}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      
      // Close the dialog if it was opened
      setViewQuotation(null);
    } catch (error) {
      console.error("Error sending quotation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send the quotation",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDuplicateQuotation = async (quotation: DisplayQuotation) => {
    try {
      // Create a new quotation based on the existing one
      const newQuotation = {
        client_id: quotation.client_id,
        date: new Date().toISOString().split('T')[0], // Today's date
        status: 'draft' as QuotationStatus,
        total_amount: quotation.total_amount,
        valid_until: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // 30 days from now
        notes: quotation.notes,
        items: quotation.items as any
      };
      
      const { error } = await supabase
        .from('quotations')
        .insert(newQuotation);
      
      if (error) throw error;
      
      toast({
        title: "Quotation duplicated",
        description: "A new draft quotation has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    } catch (error) {
      console.error("Error duplicating quotation:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the quotation.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: QuotationStatus) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Format the ID to show only the short version
  const formatId = (id: string) => {
    if (!id) return "UNKNOWN";
    // Return just the first 8 characters of the UUID
    try {
      return id.substring(0, 8).toUpperCase();
    } catch (error) {
      console.error("Error formatting ID:", error);
      return "UNKNOWN";
    }
  };

  // Safe format function for dates
  const safeFormatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "Unknown date";
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Only filter quotations if we have data and a search term
  const filteredQuotations = searchTerm && quotations 
    ? quotations.filter(quote => 
        (quote.client_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (quote.id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      )
    : quotations;

  if (quotationsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Quotations</h2>
            <p className="text-muted-foreground">Loading quotations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground">Manage client quotations</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Quotation
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search quotations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 mb-4"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount (USD)</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredQuotations || filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  {searchTerm ? "No matching quotations found." : "No quotations found. Create your first quotation!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{formatId(quote.id)}</TableCell>
                  <TableCell>{safeFormatDate(quote.date)}</TableCell>
                  <TableCell>{quote.client_name || "Unknown Client"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(quote.status)}`}>
                      {quote.status ? quote.status.charAt(0).toUpperCase() + quote.status.slice(1) : "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>${Number(quote.total_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{safeFormatDate(quote.valid_until)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewQuotation(quote)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleQuotationClick(quote)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSendQuotation(quote)}
                          disabled={quote.status === 'sent' || quote.status === 'approved' || isSending}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send to Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDuplicateQuotation(quote)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(quote)}>
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

      {/* Quotation form dialog */}
      <QuotationFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        quotation={selectedQuotation}
        clients={clients || []}
      />

      {/* Quotation view dialog */}
      <Dialog open={!!viewQuotation} onOpenChange={handleViewDialogClose}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Quotation Details</DialogTitle>
          {viewQuotation && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-semibold">#{formatId(viewQuotation.id)}</h3>
                  <p className="text-muted-foreground">
                    Created: {safeFormatDate(viewQuotation.date)}
                  </p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(viewQuotation.status)}`}>
                  {viewQuotation.status ? viewQuotation.status.charAt(0).toUpperCase() + viewQuotation.status.slice(1) : "Unknown"}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Client</h4>
                  <p>{viewQuotation.client_name || "Unknown Client"}</p>
                  {viewQuotation.client_address && <p className="text-sm text-muted-foreground">{viewQuotation.client_address}</p>}
                  {viewQuotation.client_email && <p className="text-sm text-muted-foreground">{viewQuotation.client_email}</p>}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Valid Until</h4>
                  <p>{safeFormatDate(viewQuotation.valid_until)}</p>
                </div>
              </div>
              
              {viewQuotation.notes && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-muted-foreground">{viewQuotation.notes}</p>
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
                      {viewQuotation.items && Array.isArray(viewQuotation.items) ? (
                        viewQuotation.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item?.description || "Unknown item"}</TableCell>
                            <TableCell className="text-right">{item?.quantity || 0}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item?.unit_price || 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item?.amount || 0)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No items found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                          <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                          <TableCell className="text-right">{formatCurrency(calculateTotal(viewQuotation.items))}</TableCell>
                      </TableRow>
                      {viewQuotation.vat_percentage && viewQuotation.vat_percentage > 0 && (
                          <TableRow>
                              <TableCell colSpan={3} className="text-right">VAT ({viewQuotation.vat_percentage}%)</TableCell>
                              <TableCell className="text-right">{formatCurrency(calculateTotal(viewQuotation.items) * (viewQuotation.vat_percentage / 100))}</TableCell>
                          </TableRow>
                      )}
                      {viewQuotation.discount_percentage && viewQuotation.discount_percentage > 0 && (
                          <TableRow>
                              <TableCell colSpan={3} className="text-right">Discount ({viewQuotation.discount_percentage}%)</TableCell>
                              <TableCell className="text-right">-{formatCurrency(calculateTotal(viewQuotation.items) * (viewQuotation.discount_percentage / 100))}</TableCell>
                          </TableRow>
                      )}
                      <TableRow className="font-bold border-t">
                          <TableCell colSpan={3} className="text-right">Total</TableCell>
                          <TableCell className="text-right">{formatCurrency(viewQuotation.total_amount)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
              
              <DialogFooter className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setViewQuotation(null)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => generateQuotationPDF(viewQuotation)}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button 
                  onClick={() => handleSendQuotation(viewQuotation)} 
                  disabled={viewQuotation.status === 'sent' || viewQuotation.status === 'approved' || isSending}
                >
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
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm deletion dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quotation. This action cannot be undone.
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
