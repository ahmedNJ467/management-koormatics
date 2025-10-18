import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DisplayQuotation, QuotationStatus } from "@/lib/types/quotation";
import { pdfColors } from "@/components/reports/utils/pdf/pdfStyles";
import { toast } from "@/hooks/use-toast";
import {
  formatCurrency,
  formatDate,
  formatInvoiceId as formatQuotationId,
} from "@/lib/invoice-helpers";
import { supabase } from "@/integrations/supabase/client";

export const generateQuotationPDF = async (quotation: DisplayQuotation) => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  doc.setFont("helvetica");

  // Load Koormatics logo with high-quality rendering
  const logoUrl = "/images/Koormatics-logo.png";
  const logoWidth = 60; // Increased width for better visibility
  const logoHeight = 18; // Increased height proportionally

  try {
    const pngDataUrl: string = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Higher scale factor for maximum clarity
        const targetScale = 4; // Increased from 3 to 4 for better quality
        canvas.width = Math.max(1, Math.floor(logoWidth * targetScale));
        canvas.height = Math.max(1, Math.floor(logoHeight * targetScale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas 2D context unavailable"));

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw image with high quality settings
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png", 1.0)); // Maximum quality
      };
      img.onerror = (err) => reject(err);
      img.src = logoUrl;
    });
    doc.addImage(pngDataUrl, "PNG", margin, 15, logoWidth, logoHeight);
  } catch (e) {
    console.error("Error adding logo:", e);
    // Fallback to text logo
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      pdfColors.primary[0],
      pdfColors.primary[1],
      pdfColors.primary[2]
    );
    doc.text("Koormatics", margin, 25);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  const companyInfoText = [
    "Wadajir district.",
    "Airport Road, Mogadishu, Somalia",
    "www.koormatics.com",
    "+252-619494974",
  ];
  doc.text(companyInfoText, margin, 15 + logoHeight + 5);

  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    pdfColors.primary[0],
    pdfColors.primary[1],
    pdfColors.primary[2]
  );
  doc.text("QUOTATION", pageW - margin, 25, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  let yPosHeader = 35;
  doc.text(
    `Quotation #: ${formatQuotationId(quotation.id)}`,
    pageW - margin,
    yPosHeader,
    { align: "right" }
  );
  yPosHeader += 6;
  doc.text(`Date: ${formatDate(quotation.date)}`, pageW - margin, yPosHeader, {
    align: "right",
  });
  yPosHeader += 6;
  doc.text(
    `Valid Until: ${formatDate(quotation.valid_until)}`,
    pageW - margin,
    yPosHeader,
    { align: "right" }
  );

  let yPos = 15 + logoHeight + 5 + companyInfoText.length * 5 + 5; // Reduced spacing

  // Create compact bordered box for client information
  const clientBoxWidth = 80;
  const clientBoxHeight = 35; // Increased height for better text spacing
  const clientBoxX = margin;
  const clientBoxY = yPos;

  // Draw border around client info box
  doc.setDrawColor(
    pdfColors.border[0],
    pdfColors.border[1],
    pdfColors.border[2]
  );
  doc.setLineWidth(0.5);
  doc.rect(clientBoxX, clientBoxY, clientBoxWidth, clientBoxHeight);

  // Add client information inside the box (no "BILL TO" header)
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
  let clientY = clientBoxY + 6; // Increased top padding for better spacing

  // Client name
  doc.setFont("helvetica", "bold");
  doc.text(quotation.client_name, clientBoxX + 4, clientY);
  clientY += 5; // Consistent spacing

  // Client address
  if (quotation.client_address) {
    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(
      quotation.client_address,
      clientBoxWidth - 8
    );
    doc.text(addressLines, clientBoxX + 4, clientY);
    clientY += doc.getTextDimensions(addressLines).h + 3; // Better spacing
  }

  // Client email
  if (quotation.client_email) {
    doc.setFont("helvetica", "normal");
    doc.text(quotation.client_email, clientBoxX + 4, clientY);
    clientY += 4; // Consistent spacing
  }

  // Client phone
  if (quotation.client_phone) {
    doc.setFont("helvetica", "normal");
    doc.text(quotation.client_phone, clientBoxX + 4, clientY);
  }

  // Update yPos for table positioning with reduced spacing
  yPos = clientBoxY + clientBoxHeight + 6; // Reduced spacing after box

  const tableStartY = Math.max(yPos, 70) + 8; // Reduced spacing before table

  autoTable(doc, {
    startY: tableStartY,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: quotation.items.map((item) => [
      item.description,
      item.quantity,
      formatCurrency(item.unit_price),
      formatCurrency(item.amount),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [
        pdfColors.headerBg[0],
        pdfColors.headerBg[1],
        pdfColors.headerBg[2],
      ],
      textColor: [
        pdfColors.headerText[0],
        pdfColors.headerText[1],
        pdfColors.headerText[2],
      ],
      fontStyle: "bold" as any,
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      textColor: [pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]] as [
        number,
        number,
        number
      ],
      lineColor: [
        pdfColors.border[0],
        pdfColors.border[1],
        pdfColors.border[2],
      ],
    },
    alternateRowStyles: {
      fillColor: [
        pdfColors.rowAlt[0],
        pdfColors.rowAlt[1],
        pdfColors.rowAlt[2],
      ],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;
  let yPosTotals = finalY + 10;

  const subtotal = quotation.items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = quotation.vat_percentage
    ? subtotal * (quotation.vat_percentage / 100)
    : 0;
  const discountAmount = quotation.discount_percentage
    ? subtotal * (quotation.discount_percentage / 100)
    : 0;
  const totalAmount = quotation.total_amount;

  const totalCol1 = pageW - margin - 50;
  const totalCol2 = pageW - margin;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);

  doc.text("Subtotal:", totalCol1, yPosTotals, { align: "right" });
  doc.text(formatCurrency(subtotal), totalCol2, yPosTotals, { align: "right" });
  yPosTotals += 7;

  if (vatAmount > 0) {
    doc.text(`VAT (${quotation.vat_percentage}%)`, totalCol1, yPosTotals, {
      align: "right",
    });
    doc.text(formatCurrency(vatAmount), totalCol2, yPosTotals, {
      align: "right",
    });
    yPosTotals += 7;
  }

  if (discountAmount > 0) {
    doc.text(
      `Discount (${quotation.discount_percentage}%):`,
      totalCol1,
      yPosTotals,
      { align: "right" }
    );
    doc.text(`-${formatCurrency(discountAmount)}`, totalCol2, yPosTotals, {
      align: "right",
    });
    yPosTotals += 7;
  }

  doc.setDrawColor(
    pdfColors.border[0],
    pdfColors.border[1],
    pdfColors.border[2]
  );
  doc.line(totalCol1 - 5, yPosTotals - 3, totalCol2, yPosTotals - 3);

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
  yPosTotals += 15;

  let yPosAfterTotals = yPosTotals;

  if (quotation.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      pdfColors.primary[0],
      pdfColors.primary[1],
      pdfColors.primary[2]
    );
    doc.text("Notes:", margin, yPosAfterTotals);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    const splitNotes = doc.splitTextToSize(quotation.notes, pageW - margin * 2);
    doc.text(splitNotes, margin, yPosAfterTotals + 5);
    yPosAfterTotals += doc.getTextDimensions(splitNotes).h + 10;
  }

  const finalContent = [];
  finalContent.push([
    {
      content: "Payment Communication:",
      styles: {
        fontStyle: "bold" as any,
        textColor: [
          pdfColors.primary[0],
          pdfColors.primary[1],
          pdfColors.primary[2],
        ],
        fontSize: 10,
      },
    },
  ]);
  finalContent.push([
    {
      content:
        "Please use the following communication for your payment : 78991069",
      styles: { fontSize: 9 },
    },
  ]);
  finalContent.push([""]); // spacer
  finalContent.push([
    {
      content: "Terms and Conditions:",
      styles: {
        fontStyle: "bold" as any,
        textColor: [
          pdfColors.primary[0],
          pdfColors.primary[1],
          pdfColors.primary[2],
        ],
        fontSize: 10,
      },
    },
  ]);

  const terms = [
    "1. The quotation provided is valid for a period of thirty (30) days from the date of issue unless otherwise stated",
    "2. For all clients without an account or contract with us, a 50% down payment of the quoted amount, payable by cash or bank transfer, is required to confirm bookings.",
    "3. Payment for services is due upon receipt of invoice, unless otherwise specified.",
  ].join("\n\n");
  finalContent.push([{ content: terms, styles: { fontSize: 8 } }]);

  finalContent.push([""]); // spacer
  finalContent.push([
    {
      content: "Bank Details:",
      styles: {
        fontStyle: "bold" as any,
        textColor: [
          pdfColors.primary[0],
          pdfColors.primary[1],
          pdfColors.primary[2],
        ],
        fontSize: 10,
      },
    },
  ]);
  finalContent.push([
    {
      content: "Dahabshil Bank",
      styles: { fontStyle: "bold" as any, fontSize: 9 },
    },
  ]);

  const dahabshilDetails = [
    "Account Name: Peace Business Group",
    "Account Number: 104 102 369",
    "Swift Codes: EABDDJJD",
    "Branch: Mogadishu, Somalia",
    "IBAN: SO600002301301008035901",
  ].join("\n");
  finalContent.push([{ content: dahabshilDetails, styles: { fontSize: 9 } }]);

  finalContent.push([""]); // spacer
  finalContent.push([
    {
      content: "Premier Bank",
      styles: { fontStyle: "bold" as any, fontSize: 9 },
    },
  ]);

  const premierDetails = [
    "Account Name: Peace Business Group",
    "Account Number: 020600296001",
    "IBAN: SO600005002020600296001",
  ].join("\n");
  finalContent.push([{ content: premierDetails, styles: { fontSize: 9 } }]);

  autoTable(doc, {
    startY: yPosAfterTotals,
    body: finalContent as any,
    theme: "plain",
    styles: {
      font: "helvetica",
      textColor: [pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]] as [
        number,
        number,
        number
      ],
      cellPadding: { top: 0, right: 0, bottom: 1, left: 0 },
    },
    columnStyles: {
      0: { cellWidth: pageW - margin * 2 },
    },
  });

  // Add footer to all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    doc.text(
      "Thank you for your business!",
      margin,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageW - margin,
      doc.internal.pageSize.height - 10,
      { align: "right" }
    );
  }

  doc.save(`Quotation-${formatQuotationId(quotation.id)}.pdf`);

  toast({
    title: "Quotation PDF Generated",
    description: "Your quotation has been downloaded.",
  });
};

export const sendQuotationByEmail = async (
  quotation: DisplayQuotation
): Promise<boolean> => {
  if (!quotation.client_email) {
    toast({
      title: "Error",
      description: "Client does not have an email address.",
      variant: "destructive",
    });
    return false;
  }

  try {
    console.log(
      "Sending quotation email with PDF attachment for quotation ID:",
      quotation.id
    );

    // Show loading toast
    const loadingToast = toast({
      title: "Sending quotation...",
      description: "Generating PDF and sending email to client",
    });

    const { data, error: invokeError } = await supabase.functions.invoke(
      "send-quotation",
      {
        body: {
          quotationId: quotation.id,
          clientEmail: quotation.client_email,
          clientName: quotation.client_name,
        },
      }
    );

    if (invokeError) {
      console.error("Invoke error:", invokeError);
      throw invokeError;
    }

    // Check if the function returned an error
    if (data?.error) {
      console.error("Function returned error:", data.error);
      throw new Error(data.error);
    }

    // Update quotation status to 'sent'
    const { error } = await supabase
      .from("quotations")
      .update({ status: "sent" as QuotationStatus })
      .eq("id", quotation.id);

    if (error) {
      console.error("Status update error:", error);
      throw error;
    }

    // Dismiss loading toast and show success
    loadingToast.dismiss?.();

    toast({
      title: "📧 Quotation sent successfully!",
      description: `PDF quotation has been sent to ${quotation.client_email}`,
    });

    return true;
  } catch (error) {
    console.error("Error sending quotation:", error);

    let errorMessage = "Failed to send the quotation";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    toast({
      title: "❌ Failed to send quotation",
      description: errorMessage,
      variant: "destructive",
    });

    return false;
  }
};
