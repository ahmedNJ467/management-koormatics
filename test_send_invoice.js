// Test script to debug the send-invoice Edge Function
// Run this in your browser console or as a Node.js script

const testSendInvoice = async () => {
  try {
    // Replace with your actual Supabase URL and anon key
    const supabaseUrl = "YOUR_SUPABASE_URL";
    const supabaseKey = "YOUR_SUPABASE_ANON_KEY";

    // Create Supabase client
    const { createClient } = supabase;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // First, get an invoice to test with
    const { data: invoices, error: fetchError } = await supabaseClient
      .from("invoices")
      .select(
        `
        id,
        date,
        due_date,
        status,
        total_amount,
        paid_amount,
        vat_percentage,
        discount_percentage,
        items,
        notes,
        clients:client_id(name, email, address, phone)
      `
      )
      .limit(1);

    if (fetchError) {
      console.error("Error fetching invoices:", fetchError);
      return;
    }

    if (!invoices || invoices.length === 0) {
      console.error("No invoices found to test with");
      return;
    }

    const testInvoice = invoices[0];
    console.log("Test invoice:", testInvoice);

    // Check if the invoice has the required data
    if (!testInvoice.clients?.email) {
      console.error("Invoice has no client email address");
      return;
    }

    // Test the Edge Function
    console.log("Testing send-invoice function...");
    const { data, error } = await supabaseClient.functions.invoke(
      "send-invoice",
      {
        body: {
          invoiceId: testInvoice.id,
          clientEmail: testInvoice.clients.email,
          clientName: testInvoice.clients.name || "Test Client",
        },
      }
    );

    if (error) {
      console.error("Edge Function error:", error);
    } else {
      console.log("Edge Function success:", data);
    }
  } catch (error) {
    console.error("Test error:", error);
  }
};

// Run the test
testSendInvoice();
