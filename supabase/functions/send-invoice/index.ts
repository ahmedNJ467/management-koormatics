import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Resend } from "npm:resend@2.0.0";
// @ts-ignore
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
// @ts-ignore
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

interface InvoiceEmailRequest {
  invoiceId: string;
  clientEmail: string;
  clientName: string;
}

// PDF styling constants
const pdfColors = {
  primary: [31, 81, 255],
  text: [51, 51, 51],
  headerBg: [248, 249, 250],
  headerText: [31, 81, 255],
  border: [229, 231, 235],
  rowAlt: [249, 250, 251],
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

const formatInvoiceId = (id: string): string => {
  return id.substring(0, 8).toUpperCase();
};

const generateInvoicePDF = (invoice: any): Uint8Array => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Set font
  doc.setFont("helvetica");

  // Company Logo and Info
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    pdfColors.primary[0],
    pdfColors.primary[1],
    pdfColors.primary[2]
  );
  doc.text("Koormatics", margin, 25);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  const companyInfoText = [
    "Wadajir district.",
    "Airport Road, Mogadishu, Somalia",
    "www.koormatics.com",
    "+252-619494974",
  ];
  doc.text(companyInfoText, margin, 35);

  // Invoice Title
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    pdfColors.primary[0],
    pdfColors.primary[1],
    pdfColors.primary[2]
  );
  doc.text("INVOICE", pageW - margin, 25, { align: "right" });

  // Invoice Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  let yPosHeader = 35;
  doc.text(
    `Invoice #: ${formatInvoiceId(invoice.id)}`,
    pageW - margin,
    yPosHeader,
    { align: "right" }
  );
  yPosHeader += 6;
  doc.text(`Date: ${formatDate(invoice.date)}`, pageW - margin, yPosHeader, {
    align: "right",
  });
  yPosHeader += 6;
  doc.text(
    `Due Date: ${formatDate(invoice.due_date)}`,
    pageW - margin,
    yPosHeader,
    { align: "right" }
  );

  // Client Information
  let yPos = 35 + companyInfoText.length * 5 + 10;
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
  yPos += 5;
  doc.text(invoice.clients?.name || "Unknown Client", margin, yPos);
  yPos += 5;
  if (invoice.clients?.address) {
    const addressLines = doc.splitTextToSize(invoice.clients.address, 80);
    doc.text(addressLines, margin, yPos);
    yPos += addressLines.length * 5;
  }
  if (invoice.clients?.email) {
    doc.text(invoice.clients.email, margin, yPos);
    yPos += 5;
  }
  if (invoice.clients?.phone) {
    doc.text(invoice.clients.phone, margin, yPos);
  }

  // Items Table
  const tableStartY = Math.max(yPos, 70) + 15;

  const tableData = (invoice.items as any[]).map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.amount),
  ]);

  // @ts-ignore
  doc.autoTable({
    startY: tableStartY,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: pdfColors.headerBg,
      textColor: pdfColors.headerText,
      fontStyle: "bold",
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      textColor: pdfColors.text,
      lineColor: pdfColors.border,
    },
    alternateRowStyles: {
      fillColor: pdfColors.rowAlt,
    },
  });

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || 100;
  let yPosTotals = finalY + 10;

  // Calculate totals
  const subtotal = (invoice.items as any[]).reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const vatAmount = invoice.vat_percentage
    ? subtotal * (invoice.vat_percentage / 100)
    : 0;
  const discountAmount = invoice.discount_percentage
    ? subtotal * (invoice.discount_percentage / 100)
    : 0;
  const totalAmount = invoice.total_amount;
  const balanceDue = totalAmount - (invoice.paid_amount || 0);

  const totalCol1 = pageW - margin - 50;
  const totalCol2 = pageW - margin;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);

  // Subtotal
  doc.text("Subtotal:", totalCol1, yPosTotals, { align: "right" });
  doc.text(formatCurrency(subtotal), totalCol2, yPosTotals, { align: "right" });
  yPosTotals += 7;

  // VAT
  if (vatAmount > 0) {
    doc.text(`VAT (${invoice.vat_percentage}%):`, totalCol1, yPosTotals, {
      align: "right",
    });
    doc.text(formatCurrency(vatAmount), totalCol2, yPosTotals, {
      align: "right",
    });
    yPosTotals += 7;
  }

  // Discount
  if (discountAmount > 0) {
    doc.text(
      `Discount (${invoice.discount_percentage}%):`,
      totalCol1,
      yPosTotals,
      { align: "right" }
    );
    doc.text(`-${formatCurrency(discountAmount)}`, totalCol2, yPosTotals, {
      align: "right",
    });
    yPosTotals += 7;
  }

  // Total line
  doc.setDrawColor(
    pdfColors.border[0],
    pdfColors.border[1],
    pdfColors.border[2]
  );
  doc.line(totalCol1 - 5, yPosTotals - 3, totalCol2, yPosTotals - 3);

  // Total
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    pdfColors.primary[0],
    pdfColors.primary[1],
    pdfColors.primary[2]
  );
  doc.text("Total:", totalCol1, yPosTotals, { align: "right" });
  doc.text(formatCurrency(totalAmount), totalCol2, yPosTotals, {
    align: "right",
  });
  yPosTotals += 7;

  // Payment info
  if (invoice.paid_amount > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    doc.text("Amount Paid:", totalCol1, yPosTotals, { align: "right" });
    doc.text(`-${formatCurrency(invoice.paid_amount)}`, totalCol2, yPosTotals, {
      align: "right",
    });
    yPosTotals += 7;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      pdfColors.primary[0],
      pdfColors.primary[1],
      pdfColors.primary[2]
    );
    doc.text("Balance Due:", totalCol1, yPosTotals, { align: "right" });
    doc.text(formatCurrency(balanceDue), totalCol2, yPosTotals, {
      align: "right",
    });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      pdfColors.primary[0],
      pdfColors.primary[1],
      pdfColors.primary[2]
    );
    doc.text("Balance Due:", totalCol1, yPosTotals, { align: "right" });
    doc.text(formatCurrency(balanceDue), totalCol2, yPosTotals, {
      align: "right",
    });
  }

  yPosTotals += 15;

  // Notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      pdfColors.primary[0],
      pdfColors.primary[1],
      pdfColors.primary[2]
    );
    doc.text("Notes:", margin, yPosTotals);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageW - margin * 2);
    doc.text(splitNotes, margin, yPosTotals + 5);
    yPosTotals += splitNotes.length * 5 + 10;
  }

  // Terms and conditions
  yPosTotals += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Terms and conditions:", margin, yPosTotals);
  yPosTotals += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const terms = [
    "1. Payment is due within 30 days of invoice date unless otherwise specified.",
    "2. Late payments may incur additional charges.",
    "3. Please include invoice number in payment reference.",
    "4. Contact us immediately if there are any discrepancies.",
  ];
  doc.text(terms, margin, yPosTotals);
  yPosTotals += terms.length * 3.5 + 10;

  doc.text("Thank you for your business!", margin, yPosTotals);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  doc.text("This is a computer-generated invoice.", margin, pageHeight - 10);
  doc.text(`Page 1 of 1`, pageW - margin, pageHeight - 10, { align: "right" });

  return doc.output("arraybuffer");
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
    let requestData: InvoiceEmailRequest;
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

    const { invoiceId, clientEmail, clientName } = requestData;

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        clients:client_id(name, email, address, phone)
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Could not find the invoice" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Generate PDF
    console.log("Generating PDF for invoice:", invoiceId);
    const pdfBuffer = generateInvoicePDF(invoice);
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Format invoice ID for display
    const shortId = formatInvoiceId(invoiceId);

    // Calculate totals for email
    const subtotal = (invoice.items as any[]).reduce(
      (sum: number, item: any) => sum + (item.amount || 0),
      0
    );
    const vatAmount = invoice.vat_percentage
      ? subtotal * (invoice.vat_percentage / 100)
      : 0;
    const discountAmount = invoice.discount_percentage
      ? subtotal * (invoice.discount_percentage / 100)
      : 0;
    const balanceDue = (invoice.total_amount || 0) - (invoice.paid_amount || 0);

    // Format items for email
    const itemsHtml = (invoice.items as any[])
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
          item.description
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
          item.quantity
        }</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(
          item.unit_price || 0
        )}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(
          item.amount || 0
        )}</td>
      </tr>
    `
      )
      .join("");

    // Create professional email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${shortId}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            margin: 0; 
            padding: 0; 
            background-color: #f9fafb;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #1f51ff 0%, #0ea5e9 100%);
            color: white; 
            padding: 32px 24px; 
            text-align: center;
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700;
          }
          .header p { 
            margin: 8px 0 0 0; 
            opacity: 0.9;
            font-size: 16px;
          }
          .content { 
            padding: 32px 24px; 
          }
          .invoice-details { 
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .invoice-details h3 {
            margin: 0 0 12px 0;
            color: #1f2937;
            font-size: 16px;
            font-weight: 600;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .detail-row:last-child {
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 500;
            color: #6b7280;
          }
          .detail-value {
            font-weight: 600;
            color: #1f2937;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 24px 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          }
          th { 
            background-color: #f8fafc; 
            color: #374151;
            font-weight: 600;
            text-align: left; 
            padding: 16px 12px;
            border-bottom: 2px solid #e5e7eb;
          }
          th:last-child, td:last-child {
            text-align: right;
          }
          th:nth-child(2), td:nth-child(2) {
            text-align: center;
          }
          .totals-section {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-top: 24px;
          }
          .totals-table { 
            width: 100%; 
            margin: 0;
            border: none;
          }
          .totals-table td { 
            padding: 8px 0;
            border: none;
            border-bottom: 1px solid #e5e7eb;
          }
          .totals-table tr:last-child td {
            border-bottom: none;
            font-weight: 700;
            font-size: 18px;
            color: #1f51ff;
            padding-top: 12px;
          }
          .balance-due {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
          }
          .balance-due h3 {
            margin: 0 0 8px 0;
            color: #92400e;
            font-size: 16px;
          }
          .balance-amount {
            font-size: 24px;
            font-weight: 700;
            color: #92400e;
            margin: 0;
          }
          .notes { 
            background-color: #eff6ff;
            border-left: 4px solid #1f51ff;
            border-radius: 4px;
            padding: 16px;
            margin: 24px 0;
          }
          .notes h3 {
            margin: 0 0 8px 0;
            color: #1e40af;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .notes p {
            margin: 0;
            color: #1e40af;
          }
          .footer { 
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
          }
          .company-info {
            margin-top: 16px;
            font-size: 12px;
            color: #9ca3af;
          }
          .status-badge {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice #${shortId}</h1>
            <p>Professional Invoice from Koormatics</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 24px;">Dear ${clientName},</p>
            
            <p style="margin-bottom: 24px;">
              Thank you for your business! Please find your invoice attached as a PDF. 
              The invoice details are summarized below for your convenience.
            </p>
            
            <div class="invoice-details">
              <h3>Invoice Information</h3>
              <div class="detail-row">
                <span class="detail-label">Invoice Date:</span>
                <span class="detail-value">${formatDate(invoice.date)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">${formatDate(
                  invoice.due_date
                )}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge">Sent</span>
              </div>
            </div>
            
            <h3 style="color: #1f2937; margin-bottom: 16px;">Invoice Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals-section">
              <table class="totals-table">
                <tbody>
                  <tr>
                    <td>Subtotal:</td>
                    <td style="text-align: right;">${formatCurrency(
                      subtotal
                    )}</td>
                  </tr>
                  ${
                    vatAmount > 0
                      ? `
                  <tr>
                    <td>VAT (${invoice.vat_percentage}%):</td>
                    <td style="text-align: right;">${formatCurrency(
                      vatAmount
                    )}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    discountAmount > 0
                      ? `
                  <tr>
                    <td>Discount (${invoice.discount_percentage}%):</td>
                    <td style="text-align: right; color: #dc2626;">-${formatCurrency(
                      discountAmount
                    )}</td>
                  </tr>`
                      : ""
                  }
                  <tr>
                    <td>Total Amount:</td>
                    <td style="text-align: right;">${formatCurrency(
                      invoice.total_amount || 0
                    )}</td>
                  </tr>
                  ${
                    invoice.paid_amount > 0
                      ? `
                  <tr>
                    <td>Amount Paid:</td>
                    <td style="text-align: right; color: #059669;">-${formatCurrency(
                      invoice.paid_amount || 0
                    )}</td>
                  </tr>`
                      : ""
                  }
                </tbody>
              </table>
            </div>

            ${
              balanceDue > 0
                ? `
            <div class="balance-due">
              <h3>Balance Due</h3>
              <p class="balance-amount">${formatCurrency(balanceDue)}</p>
            </div>`
                : ""
            }
            
            ${
              invoice.notes
                ? `
            <div class="notes">
              <h3>Additional Notes</h3>
              <p>${invoice.notes}</p>
            </div>`
                : ""
            }
            
            <p style="margin-top: 32px;">
              If you have any questions about this invoice, please don't hesitate to contact us. 
              We appreciate your prompt payment and continued business.
            </p>
            
            <p style="margin-top: 24px; font-weight: 600;">
              Best regards,<br>
              The Koormatics Team
            </p>
          </div>
          
          <div class="footer">
            <p>Payment is due by ${formatDate(
              invoice.due_date
            )}. Please include invoice #${shortId} in your payment reference.</p>
            <div class="company-info">
              <p>Koormatics | Wadajir district, Airport Road, Mogadishu, Somalia</p>
              <p>www.koormatics.com | +252-619494974</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email with PDF attachment
    console.log("Sending email to:", clientEmail);
    const emailResult = await resend.emails.send({
      from: "Koormatics <noreply@koormatics.com>",
      to: [clientEmail],
      subject: `Invoice #${shortId} from Koormatics`,
      html: htmlContent,
      attachments: [
        {
          filename: `Invoice-${shortId}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (emailResult.error) {
      console.error("Error sending email:", emailResult.error);
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: emailResult.error,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("Email sent successfully:", emailResult.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invoice sent successfully",
        emailId: emailResult.data?.id,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

serve(handler);
