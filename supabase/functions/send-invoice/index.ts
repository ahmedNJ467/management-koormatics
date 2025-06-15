
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

interface InvoiceEmailRequest {
  invoiceId: string;
  clientEmail: string;
  clientName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request body
    let requestData: InvoiceEmailRequest;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { invoiceId, clientEmail, clientName } = requestData;

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        clients:client_id(name, email)
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Could not find the invoice" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Format items for the email
    const items = (invoice.items as any[]).map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const subtotal = (invoice.items as any[]).reduce((sum, item) => sum + (item.amount || 0), 0);
    const vatAmount = invoice.vat_percentage ? subtotal * (invoice.vat_percentage / 100) : 0;
    const discountAmount = invoice.discount_percentage ? subtotal * (invoice.discount_percentage / 100) : 0;
    const balanceDue = (invoice.total_amount || 0) - (invoice.paid_amount || 0);

    // Format the invoice ID to be shorter
    const shortId = invoiceId.substring(0, 8).toUpperCase();

    // Create invoice email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${shortId}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { margin-bottom: 20px; }
          .invoice-details { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #f5f5f5; text-align: left; padding: 8px; }
          .totals-table { width: 50%; margin-left: auto; margin-top: 20px; }
          .totals-table td { padding: 8px; }
          .total-row { font-weight: bold; }
          .notes { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice #${shortId}</h1>
          </div>
          
          <p>Dear ${clientName},</p>
          
          <p>Please find attached your invoice. Details are provided below:</p>
          
          <div class="invoice-details">
            <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="padding: 8px; text-align: left;">Description</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Unit Price</th>
                <th style="padding: 8px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>

          <table class="totals-table">
            <tbody>
              <tr>
                <td style="text-align: right;">Subtotal:</td>
                <td style="text-align: right;">$${subtotal.toFixed(2)}</td>
              </tr>
              ${vatAmount > 0 ? `
              <tr>
                <td style="text-align: right;">VAT (${invoice.vat_percentage}%):</td>
                <td style="text-align: right;">$${vatAmount.toFixed(2)}</td>
              </tr>` : ''}
              ${discountAmount > 0 ? `
              <tr>
                <td style="text-align: right;">Discount (${invoice.discount_percentage}%):</td>
                <td style="text-align: right;">-$${discountAmount.toFixed(2)}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td style="text-align: right;">Total:</td>
                <td style="text-align: right;">$${(invoice.total_amount || 0).toFixed(2)}</td>
              </tr>
              ${invoice.paid_amount > 0 ? `
              <tr>
                <td style="text-align: right;">Amount Paid:</td>
                <td style="text-align: right;">-$${(invoice.paid_amount || 0).toFixed(2)}</td>
              </tr>` : ''}
              <tr class="total-row" style="border-top: 1px solid #ddd;">
                <td style="text-align: right;">Balance Due:</td>
                <td style="text-align: right;">$${balanceDue.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          ${invoice.notes ? `
          <div class="notes">
            <h3>Notes:</h3>
            <p>${invoice.notes}</p>
          </div>
          ` : ''}
          
          <p>If you have any questions or would like to discuss this invoice further, please don't hesitate to contact us.</p>
          
          <p>Thank you for your business.</p>
          
          <p>Best regards,<br>The Koormatics Team</p>
          
          <div class="footer">
            <p>Payment is due by ${new Date(invoice.due_date).toLocaleDateString()}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Send the email
      const emailResponse = await resend.emails.send({
        from: "Invoices <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `Invoice #${shortId} from Koormatics`,
        html: htmlContent,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ 
          error: emailError instanceof Error ? emailError.message : "Failed to send email" 
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  } catch (error) {
    console.error("Error in send-invoice function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};

serve(handler);
