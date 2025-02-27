
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

interface QuotationEmailRequest {
  quotationId: string;
  clientEmail: string;
  clientName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request body
    let requestData: QuotationEmailRequest;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { quotationId, clientEmail, clientName } = requestData;

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        clients:client_id(name, email)
      `)
      .eq("id", quotationId)
      .single();

    if (quotationError) {
      console.error("Error fetching quotation:", quotationError);
      return new Response(
        JSON.stringify({ error: "Could not find the quotation" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Format items for the email
    const items = (quotation.items as any[]).map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    // Format the quotation ID to be shorter
    const shortId = quotationId.substring(0, 8).toUpperCase();

    // Create quotation email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation #${shortId}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { margin-bottom: 20px; }
          .quotation-details { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #f5f5f5; text-align: left; padding: 8px; }
          .total-row { font-weight: bold; }
          .notes { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Quotation #${shortId}</h1>
          </div>
          
          <p>Dear ${clientName},</p>
          
          <p>Please find attached our quotation for your review. Details are provided below:</p>
          
          <div class="quotation-details">
            <p><strong>Date:</strong> ${new Date(quotation.date).toLocaleDateString()}</p>
            <p><strong>Valid Until:</strong> ${new Date(quotation.valid_until).toLocaleDateString()}</p>
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
              <tr class="total-row">
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">$${quotation.total_amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          ${quotation.notes ? `
          <div class="notes">
            <h3>Notes:</h3>
            <p>${quotation.notes}</p>
          </div>
          ` : ''}
          
          <p>If you have any questions or would like to discuss this quotation further, please don't hesitate to contact us.</p>
          
          <p>Thank you for considering our services.</p>
          
          <p>Best regards,<br>Your Company</p>
          
          <div class="footer">
            <p>This quotation is valid until ${new Date(quotation.valid_until).toLocaleDateString()}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Send the email
      const emailResponse = await resend.emails.send({
        from: "Quotations <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `Quotation #${shortId} for ${clientName}`,
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
    console.error("Error in send-quotation function:", error);
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
