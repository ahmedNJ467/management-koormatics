import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers with proper localhost support
const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "https://kgmjttamzppmypwzargk.supabase.co",
  ];

  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : "*";

  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, Content-Type, Authorization, X-Client-Info, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return "Invalid Date";
  }
};

interface LeaseInvoiceGenerationRequest {
  billingMonth?: string; // Format: YYYY-MM, defaults to current month
  dryRun?: boolean; // If true, only simulate without creating invoices
}

interface LeaseInvoiceGenerationResult {
  success: boolean;
  generatedCount: number;
  errors: string[];
  generatedInvoices: any[];
  billingPeriod: {
    start: string;
    end: string;
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let requestData: LeaseInvoiceGenerationRequest = {};
    if (req.method === "POST") {
      try {
        requestData = await req.json();
      } catch (e) {
        console.log("No request body provided, using defaults");
      }
    }

    const { billingMonth, dryRun = false } = requestData;

    // Determine billing period
    let billingPeriodStart: Date;
    let billingPeriodEnd: Date;

    if (billingMonth) {
      // Parse the provided month (YYYY-MM format)
      const [year, month] = billingMonth.split("-").map(Number);
      billingPeriodStart = new Date(year, month - 1, 1);
      billingPeriodEnd = new Date(year, month, 0); // Last day of the month
    } else {
      // Use current month
      const now = new Date();
      billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    console.log(
      `Generating invoices for billing period: ${
        billingPeriodStart.toISOString().split("T")[0]
      } to ${billingPeriodEnd.toISOString().split("T")[0]}`
    );

    const result: LeaseInvoiceGenerationResult = {
      success: true,
      generatedCount: 0,
      errors: [],
      generatedInvoices: [],
      billingPeriod: {
        start: billingPeriodStart.toISOString().split("T")[0],
        end: billingPeriodEnd.toISOString().split("T")[0],
      },
    };

    // Get all active leases that should be billed for this period
    const { data: activeLeases, error: leasesError } = await supabase
      .from("vehicle_leases")
      .select("*")
      .eq("lease_status", "active")
      .lte("lease_start_date", billingPeriodEnd.toISOString().split("T")[0])
      .gte("lease_end_date", billingPeriodStart.toISOString().split("T")[0]);

    if (leasesError) {
      throw new Error(`Failed to fetch active leases: ${leasesError.message}`);
    }

    if (!activeLeases || activeLeases.length === 0) {
      console.log("No active leases found for billing period");
      return new Response(
        JSON.stringify({
          ...result,
          message: "No active leases found for the specified billing period",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which leases already have invoices for this billing period
    const { data: existingInvoices, error: existingError } = await supabase
      .from("lease_invoices")
      .select("lease_id")
      .eq(
        "billing_period_start",
        billingPeriodStart.toISOString().split("T")[0]
      )
      .eq("billing_period_end", billingPeriodEnd.toISOString().split("T")[0]);

    if (existingError) {
      throw new Error(
        `Failed to check existing invoices: ${existingError.message}`
      );
    }

    const existingLeaseIds = new Set(
      existingInvoices?.map((inv) => inv.lease_id) || []
    );
    const leasesToBill = activeLeases.filter(
      (lease) => !existingLeaseIds.has(lease.id)
    );

    console.log(
      `Found ${leasesToBill.length} leases to bill (${
        activeLeases.length - leasesToBill.length
      } already have invoices)`
    );

    if (dryRun) {
      // Simulate invoice generation without creating actual records
      for (const lease of leasesToBill) {
        const amount = calculateLeaseAmount(
          lease,
          billingPeriodStart,
          billingPeriodEnd
        );
        result.generatedInvoices.push({
          lease_id: lease.id,
          contract_number: lease.contract_number,
          lessee_name: lease.lessee_name,
          amount: amount,
          simulated: true,
        });
        result.generatedCount++;
      }
    } else {
      // Generate actual invoices
      for (const lease of leasesToBill) {
        try {
          const invoiceData = await generateInvoiceForLease(
            supabase,
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
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-lease-invoices function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        generatedCount: 0,
        errors: [
          error instanceof Error ? error.message : "Unknown error occurred",
        ],
        generatedInvoices: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Calculate the lease amount for a specific billing period
 */
function calculateLeaseAmount(
  lease: any,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
): number {
  const leaseStart = new Date(lease.lease_start_date);
  const leaseEnd = new Date(lease.lease_end_date);

  // If lease starts or ends during the billing period, calculate prorated amount
  const effectiveStart =
    leaseStart > billingPeriodStart ? leaseStart : billingPeriodStart;
  const effectiveEnd =
    leaseEnd < billingPeriodEnd ? leaseEnd : billingPeriodEnd;

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
 * Generate a single invoice for a specific lease and billing period
 */
async function generateInvoiceForLease(
  supabase: any,
  lease: any,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
): Promise<any> {
  // Calculate the amount to bill
  const amount = calculateLeaseAmount(
    lease,
    billingPeriodStart,
    billingPeriodEnd
  );

  // Create invoice items
  const invoiceItems = [
    {
      description: `Vehicle Lease - ${lease.contract_number} (${formatDate(
        billingPeriodStart.toISOString().split("T")[0]
      )} - ${formatDate(billingPeriodEnd.toISOString().split("T")[0])})`,
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
      date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days from now
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
      billing_period_start: billingPeriodStart.toISOString().split("T")[0],
      billing_period_end: billingPeriodEnd.toISOString().split("T")[0],
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

  return {
    ...leaseInvoiceData,
    contract_number: lease.contract_number,
    lessee_name: lease.lessee_name,
  };
}
