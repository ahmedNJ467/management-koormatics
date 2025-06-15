
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceStatus, DisplayInvoice, PaymentMethod } from "@/lib/types/invoice";
import { format } from "date-fns";

export function useInvoiceMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceData, editInvoice, selectedTrips }: { invoiceData: Partial<Invoice>, editInvoice: DisplayInvoice | null, selectedTrips: string[] }) => {
      if (editInvoice) {
        const { error } = await supabase.from("invoices").update(invoiceData).eq("id", editInvoice.id);
        if (error) throw error;
        return editInvoice;
      } else {
        const { data, error } = await supabase.from("invoices").insert(invoiceData).select();
        if (error) throw error;
        const newInvoice = data[0];
        if (selectedTrips.length > 0) {
          const { error: updateError } = await supabase.from("trips").update({ invoice_id: newInvoice.id }).in("id", selectedTrips);
          if (updateError) throw new Error("Invoice created, but failed to link trips.");
        }
        return newInvoice;
      }
    },
    onSuccess: (data, variables) => {
      toast({ title: `Invoice ${variables.editInvoice ? 'updated' : 'created'}`, description: "Invoice details have been saved." });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["availableTrips"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save invoice.", variant: "destructive" });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ invoice, amount, method, date, notes }: { invoice: DisplayInvoice, amount: number, method: PaymentMethod, date: string, notes: string }) => {
      const newPaidAmount = (invoice.paid_amount || 0) + amount;
      const newStatus: InvoiceStatus = newPaidAmount >= invoice.total_amount ? "paid" : "sent";
      const paymentNote = `Payment (${format(new Date(date), "MMM d, yyyy")}): ${notes}`;
      const newNotes = invoice.notes ? `${invoice.notes}\n\n${paymentNote}` : paymentNote;
      
      const { error } = await supabase.from("invoices").update({
        paid_amount: newPaidAmount,
        payment_date: date,
        payment_method: method,
        status: newStatus,
        notes: newNotes,
      }).eq("id", invoice.id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      toast({ title: "Payment recorded", description: newStatus === 'paid' ? "Invoice marked as fully paid." : "Partial payment recorded." });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record payment.", variant: "destructive" });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      await supabase.from("trips").update({ invoice_id: null }).eq("invoice_id", invoiceId);
      const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Invoice deleted", description: "The invoice has been removed." });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete invoice.", variant: "destructive" });
    },
  });

  return {
    saveInvoice: saveInvoiceMutation.mutateAsync,
    isSaving: saveInvoiceMutation.isPending,
    recordPayment: recordPaymentMutation.mutateAsync,
    isRecordingPayment: recordPaymentMutation.isPending,
    deleteInvoice: deleteInvoiceMutation.mutate,
    isDeleting: deleteInvoiceMutation.isPending,
  };
}
