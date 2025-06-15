import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { InvoiceItem, prepareForSupabase } from "@/lib/types/invoice";
import { add } from "date-fns";

export async function generateInvoiceForTrip(trip: DisplayTrip) {
  if (!trip.client_id) {
    throw new Error("Trip does not have a client to invoice.");
  }

  const vehicleTypeDescription = trip.vehicle_type
    ? ` (${trip.vehicle_type
        .replace("_", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())})`
    : "";

  const invoiceItems: InvoiceItem[] = [
    {
      description: `Trip from ${trip.pickup_location || "N/A"} to ${
        trip.dropoff_location || "N/A"
      } on ${trip.date}${vehicleTypeDescription}`,
      quantity: 1,
      unit_price: trip.amount,
      amount: trip.amount,
    },
  ];

  const today = new Date();
  const dueDate = add(today, { days: 30 });

  const { data: invoiceData, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      client_id: trip.client_id,
      date: today.toISOString().split("T")[0],
      due_date: dueDate.toISOString().split("T")[0],
      status: "draft",
      items: prepareForSupabase(invoiceItems),
      total_amount: trip.amount,
      paid_amount: 0,
    })
    .select("id")
    .single();

  if (invoiceError) {
    console.error("Error creating invoice:", invoiceError);
    throw new Error("Failed to create invoice.");
  }

  const invoiceId = invoiceData.id;

  // Now, update the trip with the new invoice ID
  const { error: tripUpdateError } = await supabase
    .from("trips")
    .update({ invoice_id: invoiceId })
    .eq("id", trip.id);

  if (tripUpdateError) {
    // This is not ideal. We've created an invoice but failed to link it.
    // For now, we'll just log this. In a real app, we might want to handle this more robustly.
    console.error("Failed to link invoice to trip:", tripUpdateError);
  }

  return invoiceData;
}
