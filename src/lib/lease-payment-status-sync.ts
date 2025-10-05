import { supabase } from "@/integrations/supabase/client";

/**
 * Updates the payment status of a lease based on its associated invoices
 */
export async function updateLeasePaymentStatus(leaseId: string): Promise<void> {
  try {
    // Get all invoices for this lease
    const { data: leaseInvoices, error: invoiceError } = await supabase
      .from("lease_invoices")
      .select(
        `
        *,
        invoices:invoice_id (
          status
        )
      `
      )
      .eq("lease_id", leaseId);

    if (invoiceError) {
      console.error("Error fetching lease invoices:", invoiceError);
      return;
    }

    if (!leaseInvoices || leaseInvoices.length === 0) {
      // No invoices exist, set status to draft
      await supabase
        .from("vehicle_leases")
        .update({ payment_status: "draft" })
        .eq("id", leaseId);
      return;
    }

    // Count invoices by status
    const statusCounts = {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    leaseInvoices.forEach((leaseInvoice: any) => {
      const invoiceStatus = leaseInvoice.invoices?.status;
      if (invoiceStatus && statusCounts.hasOwnProperty(invoiceStatus)) {
        statusCounts[invoiceStatus as keyof typeof statusCounts]++;
      }
    });

    // Determine overall payment status
    let newPaymentStatus: string;

    if (statusCounts.overdue > 0) {
      newPaymentStatus = "overdue";
    } else if (statusCounts.cancelled === leaseInvoices.length) {
      newPaymentStatus = "cancelled";
    } else if (statusCounts.paid === leaseInvoices.length) {
      newPaymentStatus = "paid";
    } else if (statusCounts.sent > 0 || statusCounts.draft > 0) {
      newPaymentStatus = "sent";
    } else {
      newPaymentStatus = "draft";
    }

    // Update the lease payment status
    const { error: updateError } = await supabase
      .from("vehicle_leases")
      .update({
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leaseId);

    if (updateError) {
      console.error("Error updating lease payment status:", updateError);
    }
  } catch (error) {
    console.error("Error in updateLeasePaymentStatus:", error);
  }
}

/**
 * Updates payment status for all leases based on their invoices
 */
export async function updateAllLeasePaymentStatuses(): Promise<void> {
  try {
    // Get all leases
    const { data: leases, error: leasesError } = await supabase
      .from("vehicle_leases")
      .select("id");

    if (leasesError) {
      console.error("Error fetching leases:", leasesError);
      return;
    }

    if (!leases || leases.length === 0) {
      return;
    }

    // Update each lease's payment status
    for (const lease of leases) {
      await updateLeasePaymentStatus(lease.id);
    }
  } catch (error) {
    console.error("Error in updateAllLeasePaymentStatuses:", error);
  }
}

/**
 * Hook to automatically sync lease payment status when invoice status changes
 */
export function useLeasePaymentStatusSync() {
  const syncLeasePaymentStatus = async (invoiceId: string) => {
    try {
      // Get the lease_id from the invoice
      const { data: leaseInvoice, error } = await supabase
        .from("lease_invoices")
        .select("lease_id")
        .eq("invoice_id", invoiceId)
        .single();

      if (error || !leaseInvoice) {
        console.error("Error finding lease for invoice:", error);
        return;
      }

      // Update the lease payment status
      await updateLeasePaymentStatus(leaseInvoice.lease_id);
    } catch (error) {
      console.error("Error syncing lease payment status:", error);
    }
  };

  return { syncLeasePaymentStatus };
}
