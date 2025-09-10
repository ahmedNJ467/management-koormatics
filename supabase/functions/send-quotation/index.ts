import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Resend } from "npm:resend@2.0.0";
import jsPDF from "https://esm.sh/jspdf@2.5.1";
import "https://esm.sh/jspdf-autotable@3.6.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface QuotationEmailRequest {
  quotationId: string;
  clientEmail: string;
  clientName: string;
}

// PDF generation function
const generateQuotationPDF = (quotation: any): Uint8Array => {
  const doc = new jsPDF();

  // PDF styling
  const pdfColors = {
    primary: [41, 128, 185],
    secondary: [52, 73, 94],
    text: [44, 62, 80],
    accent: [231, 76, 60],
  };

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    pdfColors.primary[0],
    pdfColors.primary[1],
    pdfColors.primary[2]
  );
  doc.text("QUOTATION", margin, 30);

  // Company info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    pdfColors.secondary[0],
    pdfColors.secondary[1],
    pdfColors.secondary[2]
  );
  doc.text("KOORMATICS", margin, 45);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  const companyInfo = [
    "Fleet Management Solutions",
    "Mogadishu, Somalia",
    "Email: info@koormatics.com",
    "Phone: +252 61 234 5678",
  ];

  let yPos = 55;
  companyInfo.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });

  // Quotation details (right side)
  const shortId = quotation.id.substring(0, 8).toUpperCase();
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);

  let rightYPos = 30;
  doc.text(`Quotation #: ${shortId}`, pageW - margin, rightYPos, {
    align: "right",
  });
  rightYPos += 6;
  doc.text(
    `Date: ${new Date(quotation.date).toLocaleDateString()}`,
    pageW - margin,
    rightYPos,
    { align: "right" }
  );
  rightYPos += 6;
  doc.text(
    `Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}`,
    pageW - margin,
    rightYPos,
    { align: "right" }
  );

  // Client information
  yPos = 85;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    pdfColors.primary[0],
    pdfColors.primary[1],
    pdfColors.primary[2]
  );
  doc.text("BILL TO", margin, yPos);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  yPos += 8;
  doc.text(quotation.clients?.name || "Unknown Client", margin, yPos);
  yPos += 5;

  if (quotation.clients?.email) {
    doc.text(quotation.clients.email, margin, yPos);
    yPos += 5;
  }

  if (quotation.clients?.address) {
    const addressLines = doc.splitTextToSize(quotation.clients.address, 80);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 5;
  }

  // Items table
  const tableStartY = Math.max(yPos, 120) + 10;

  // Prepare table data
  const tableData = quotation.items.map((item: any) => [
    item.description || "",
    (item.quantity || 0).toString(),
    `$${(item.unit_price || 0).toFixed(2)}`,
    `$${(item.amount || 0).toFixed(2)}`,
  ]);

  // Add table using autoTable
  (doc as any).autoTable({
    startY: tableStartY,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: tableData,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: [pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]],
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [
        pdfColors.primary[0],
        pdfColors.primary[1],
        pdfColors.primary[2],
      ],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 25, halign: "right" },
      3: { cellWidth: 25, halign: "right" },
    },
  });

  // Calculate totals
  const subtotal = quotation.items.reduce(
    (sum: number, item: any) => sum + (item.amount || 0),
    0
  );
  const vatAmount = quotation.vat_percentage
    ? subtotal * (quotation.vat_percentage / 100)
    : 0;
  const discountAmount = quotation.discount_percentage
    ? subtotal * (quotation.discount_percentage / 100)
    : 0;
  const total = subtotal + vatAmount - discountAmount;

  // Totals section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pageW - margin - 60;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  let totalsY = finalY;
  doc.text("Subtotal:", totalsX, totalsY);
  doc.text(`$${subtotal.toFixed(2)}`, pageW - margin, totalsY, {
    align: "right",
  });
  totalsY += 6;

  if (vatAmount > 0) {
    doc.text(`VAT (${quotation.vat_percentage}%):`, totalsX, totalsY);
    doc.text(`$${vatAmount.toFixed(2)}`, pageW - margin, totalsY, {
      align: "right",
    });
    totalsY += 6;
  }

  if (discountAmount > 0) {
    doc.text(`Discount (${quotation.discount_percentage}%):`, totalsX, totalsY);
    doc.text(`-$${discountAmount.toFixed(2)}`, pageW - margin, totalsY, {
      align: "right",
    });
    totalsY += 6;
  }

  // Total line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.line(totalsX, totalsY, pageW - margin, totalsY);
  totalsY += 8;
  doc.text("Total:", totalsX, totalsY);
  doc.text(`$${total.toFixed(2)}`, pageW - margin, totalsY, { align: "right" });

  // Notes section
  if (quotation.notes) {
    totalsY += 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      pdfColors.primary[0],
      pdfColors.primary[1],
      pdfColors.primary[2]
    );
    doc.text("Notes:", margin, totalsY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    const splitNotes = doc.splitTextToSize(quotation.notes, pageW - margin * 2);
    doc.text(splitNotes, margin, totalsY + 8);
    totalsY += 8 + splitNotes.length * 5;
  }

  // Terms and conditions
  totalsY += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    pdfColors.primary[0],
    pdfColors.primary[1],
    pdfColors.primary[2]
  );
  doc.text("Terms and Conditions:", margin, totalsY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  const terms = [
    "1. This quotation is valid for 30 days from the date of issue.",
    "2. A 50% down payment is required to confirm bookings.",
    "3. Payment is due upon receipt of invoice unless otherwise specified.",
  ];

  totalsY += 8;
  terms.forEach((term) => {
    const splitTerm = doc.splitTextToSize(term, pageW - margin * 2);
    doc.text(splitTerm, margin, totalsY);
    totalsY += splitTerm.length * 4 + 2;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  doc.text("Thank you for your business!", margin, pageH - 20);
  doc.text("Page 1 of 1", pageW - margin, pageH - 20, { align: "right" });

  // Return PDF as Uint8Array
  return doc.output("arraybuffer") as Uint8Array;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Function called with method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({
          error: "Email service is not configured. Missing API key.",
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    const resend = new Resend(resendApiKey);

    // Parse request body
    let requestData: QuotationEmailRequest;
    try {
      requestData = await req.json();
      console.log("Request data:", requestData);
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { quotationId, clientEmail, clientName } = requestData;

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(
        `
        *,
        clients:client_id(name, email, address, phone)
      `
      )
      .eq("id", quotationId)
      .single();

    if (quotationError) {
      console.error("Error fetching quotation:", quotationError);
      return new Response(
        JSON.stringify({ error: "Could not find the quotation" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Generate PDF
    console.log("Generating PDF for quotation:", quotationId);
    const pdfBuffer = generateQuotationPDF(quotation);
    const pdfBase64 = btoa(String.fromCharCode(...Array.from(pdfBuffer)));

    // Format the quotation ID to be shorter
    const shortId = quotationId.substring(0, 8).toUpperCase();

    // Create simplified email HTML (since PDF is attached)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation #${shortId}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #2980b9, #3498db); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
          .highlight { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .btn { display: inline-block; background: #2980b9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Quotation #${shortId}</h1>
            <p>Professional Fleet Management Solutions</p>
          </div>
          
          <div class="content">
            <p>Dear ${clientName},</p>
            
            <p>Thank you for your interest in our fleet management services. Please find attached our detailed quotation for your review.</p>
            
            <div class="highlight">
              <h3>📄 Quotation Summary</h3>
              <p><strong>Quotation #:</strong> ${shortId}</p>
              <p><strong>Date:</strong> ${new Date(
                quotation.date
              ).toLocaleDateString()}</p>
              <p><strong>Valid Until:</strong> ${new Date(
                quotation.valid_until
              ).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> $${(
                quotation.total_amount || 0
              ).toFixed(2)}</p>
            </div>
            
            <p><strong>📎 The complete quotation with detailed terms and conditions is attached as a PDF document.</strong></p>
            
            <p>Key highlights of our services:</p>
            <ul>
              <li>✅ Professional fleet management solutions</li>
              <li>✅ 24/7 customer support</li>
              <li>✅ Competitive pricing</li>
              <li>✅ Flexible payment terms</li>
            </ul>
            
            <p>If you have any questions or would like to discuss this quotation further, please don't hesitate to contact us. We're here to help!</p>
            
            <p>We look forward to working with you and providing exceptional service for your fleet management needs.</p>
            
            <p>Best regards,<br>
            <strong>The Koormatics Team</strong><br>
            Email: info@koormatics.com<br>
            Phone: +252 61 234 5678</p>
          </div>
          
          <div class="footer">
            <p>🚛 <strong>Koormatics</strong> - Your trusted fleet management partner</p>
            <p>This quotation is valid until ${new Date(
              quotation.valid_until
            ).toLocaleDateString()}</p>
            <p>Mogadishu, Somalia | www.koormatics.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Send the email with PDF attachment
      console.log("Sending email with PDF attachment...");
      const emailResponse = await resend.emails.send({
        from: "Koormatics Quotations <quotations@koormatics.com>",
        to: [clientEmail],
        subject: `📋 Quotation #${shortId} - Fleet Management Services`,
        html: htmlContent,
        attachments: [
          {
            filename: `Quotation-${shortId}.pdf`,
            content: pdfBase64,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Quotation sent successfully with PDF attachment",
          emailId: emailResponse.data?.id,
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({
          error:
            emailError instanceof Error
              ? emailError.message
              : "Failed to send email",
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
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};

serve(handler);
