import { supabase } from "@/integrations/supabase/client";
import {
  add,
  startOfMonth,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";
import { InvoiceItem } from "@/lib/types/invoice";

export interface LeaseInvoiceData {
  id: string;
  lease_id: string;
  invoice_id: string;
  billing_period_start: string;
  billing_period_end: string;
  amount: number;
  status: string;
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleLease {
  id: string;
  vehicle_id: string;
  lessee_name: string;
  lessee_email: string;
  lessee_phone: string;
  lessee_address: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rate: number;
  daily_rate?: number;
  lease_status: string;
  payment_status: string;
  contract_number: string;
  notes?: string;
  insurance_required: boolean;
  maintenance_included: boolean;
  driver_included: boolean;
  fuel_included: boolean;
  assigned_driver_id?: string;
  early_termination_fee: number;
  created_at: string;
  updated_at: string;
}

export interface LeaseInvoiceGenerationResult {
  success: boolean;
  generatedCount: number;
  errors: string[];
  generatedInvoices: LeaseInvoiceData[];
}

/**
 * Generate monthly invoices for all active leases
 */
export async function generateMonthlyLeaseInvoices(): Promise<LeaseInvoiceGenerationResult> {
  const result: LeaseInvoiceGenerationResult = {
    success: true,
    generatedCount: 0,
    errors: [],
    generatedInvoices: [],
  };

  try {
    // Get current month's billing period
    const currentDate = new Date();
    const billingPeriodStart = startOfMonth(currentDate);
    const billingPeriodEnd = endOfMonth(currentDate);

    // Get all active leases that should be billed this month
    const { data: activeLeases, error: leasesError } = await supabase
      .from("vehicle_leases")
      .select("*")
      .eq("lease_status", "active")
      .lte("lease_start_date", format(billingPeriodEnd, "yyyy-MM-dd"))
      .gte("lease_end_date", format(billingPeriodStart, "yyyy-MM-dd"));

    if (leasesError) {
      throw new Error(`Failed to fetch active leases: ${leasesError.message}`);
    }

    if (!activeLeases || activeLeases.length === 0) {
      console.log("No active leases found for billing period");
      return result;
    }

    // Check which leases already have invoices for this billing period
    const { data: existingInvoices, error: existingError } = await supabase
      .from("lease_invoices")
      .select("lease_id")
      .eq("billing_period_start", format(billingPeriodStart, "yyyy-MM-dd"))
      .eq("billing_period_end", format(billingPeriodEnd, "yyyy-MM-dd"));

    if (existingError) {
      throw new Error(
        `Failed to check existing invoices: ${existingError.message}`
      );
    }

    const existingLeaseIds = new Set(
      existingInvoices?.map((inv) => inv.lease_id) || []
    );

    // Filter out leases that already have invoices for this period
    const leasesToBill = activeLeases.filter(
      (lease) => !existingLeaseIds.has(lease.id)
    );

    console.log(
      `Found ${leasesToBill.length} leases to bill for ${format(
        billingPeriodStart,
        "MMM yyyy"
      )}`
    );

    // Generate invoices for each lease
    for (const lease of leasesToBill) {
      try {
        const invoiceData = await generateInvoiceForLease(
          lease,
          billingPeriodStart,
          billingPeriodEnd
        );
        result.generatedInvoices.push(invoiceData);
        result.generatedCount++;
      } catch (error) {
        const errorMsg = `Failed to generate invoice for lease ${
          lease.contract_number
        }: ${error instanceof Error ? error.message : "Unknown error"}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
    return result;
  }
}

/**
 * Generate a single invoice for a specific lease and billing period
 */
export async function generateInvoiceForLease(
  lease: VehicleLease,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
): Promise<LeaseInvoiceData> {
  // Calculate the amount to bill
  const amount = calculateLeaseAmount(
    lease,
    billingPeriodStart,
    billingPeriodEnd
  );

  // Create invoice items
  const invoiceItems: InvoiceItem[] = [
    {
      description: `Vehicle Lease - ${lease.contract_number} (${format(
        billingPeriodStart,
        "dd/MM/yyyy"
      )} - ${format(billingPeriodEnd, "dd/MM/yyyy")})`,
      quantity: 1,
      unit_price: amount,
      amount: amount,
    },
  ];

  // Create the invoice
  const { data: invoiceData, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      client_id: null, // We'll need to create a client record for the lessee
      date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(add(new Date(), { days: 30 }), "yyyy-MM-dd"),
      status: "draft",
      items: invoiceItems,
      total_amount: amount,
      paid_amount: 0,
      notes: ``,
    })
    .select("id")
    .single();

  if (invoiceError) {
    throw new Error(`Failed to create invoice: ${invoiceError.message}`);
  }

  // Create the lease invoice record
  const { data: leaseInvoiceData, error: leaseInvoiceError } = await supabase
    .from("lease_invoices")
    .insert({
      lease_id: lease.id,
      invoice_id: invoiceData.id,
      billing_period_start: format(billingPeriodStart, "yyyy-MM-dd"),
      billing_period_end: format(billingPeriodEnd, "yyyy-MM-dd"),
      amount: amount,
      status: "generated",
      auto_generated: true,
    })
    .select("*")
    .single();

  if (leaseInvoiceError) {
    // Clean up the created invoice if lease invoice creation fails
    await supabase.from("invoices").delete().eq("id", invoiceData.id);
    throw new Error(
      `Failed to create lease invoice record: ${leaseInvoiceError.message}`
    );
  }

  return leaseInvoiceData;
}

/**
 * Calculate the lease amount for a specific billing period
 */
function calculateLeaseAmount(
  lease: VehicleLease,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
): number {
  const leaseStart = parseISO(lease.lease_start_date);
  const leaseEnd = parseISO(lease.lease_end_date);

  // If lease starts or ends during the billing period, calculate prorated amount
  const effectiveStart = isAfter(leaseStart, billingPeriodStart)
    ? leaseStart
    : billingPeriodStart;
  const effectiveEnd = isBefore(leaseEnd, billingPeriodEnd)
    ? leaseEnd
    : billingPeriodEnd;

  // Calculate the number of days in the effective period
  const daysInPeriod =
    Math.ceil(
      (effectiveEnd.getTime() - effectiveStart.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;
  const daysInMonth =
    Math.ceil(
      (billingPeriodEnd.getTime() - billingPeriodStart.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  // Use monthly rate if available, otherwise calculate from daily rate
  if (lease.monthly_rate && lease.monthly_rate > 0) {
    // Prorate based on days in the effective period
    return (
      Math.round(((lease.monthly_rate * daysInPeriod) / daysInMonth) * 100) /
      100
    );
  } else if (lease.daily_rate && lease.daily_rate > 0) {
    return Math.round(lease.daily_rate * daysInPeriod * 100) / 100;
  }

  throw new Error(`No valid rate found for lease ${lease.contract_number}`);
}

/**
 * Get all lease invoices for a specific lease
 */
export async function getLeaseInvoices(
  leaseId: string
): Promise<LeaseInvoiceData[]> {
  const { data, error } = await supabase
    .from("lease_invoices")
    .select("*")
    .eq("lease_id", leaseId)
    .order("billing_period_start", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lease invoices: ${error.message}`);
  }

  return data || [];
}

/**
 * Get lease invoice details with related information
 */
export async function getLeaseInvoiceDetails(leaseId?: string): Promise<any[]> {
  let query = supabase.from("lease_invoice_details").select("*");

  if (leaseId) {
    query = query.eq("lease_id", leaseId);
  }

  const { data, error } = await query.order("billing_period_start", {
    ascending: false,
  });

  if (error) {
    throw new Error(`Failed to fetch lease invoice details: ${error.message}`);
  }

  return data || [];
}

/**
 * Update lease invoice status
 */
export async function updateLeaseInvoiceStatus(
  leaseInvoiceId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from("lease_invoices")
    .update({ status })
    .eq("id", leaseInvoiceId);

  if (error) {
    throw new Error(`Failed to update lease invoice status: ${error.message}`);
  }
}

/**
 * Check if a lease has an invoice for a specific billing period
 */
export async function hasInvoiceForPeriod(
  leaseId: string,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
): Promise<boolean> {
  const { data, error } = await supabase
    .from("lease_invoices")
    .select("id")
    .eq("lease_id", leaseId)
    .eq("billing_period_start", format(billingPeriodStart, "yyyy-MM-dd"))
    .eq("billing_period_end", format(billingPeriodEnd, "yyyy-MM-dd"))
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" error
    throw new Error(`Failed to check existing invoice: ${error.message}`);
  }

  return !!data;
}
