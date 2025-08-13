import { format, isBefore, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DisplayInvoice,
  Invoice,
  InvoiceStatus,
  InvoiceItem,
  Json,
} from "@/lib/types/invoice";
import { pdfColors } from "@/components/reports/utils/pdf/pdfStyles";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { tripTypeDisplayMap } from "@/lib/types/trip/base-types";

export const formatStatus = (status: InvoiceStatus | undefined): string => {
  if (!status) return "Unknown";

  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy");
  } catch (e) {
    return "Invalid Date";
  }
};

export const getStatusColor = (status: InvoiceStatus | undefined): string => {
  if (!status) return "bg-gray-100 text-gray-700";

  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "sent":
      return "bg-blue-100 text-blue-700";
    case "paid":
      return "bg-green-100 text-green-700";
    case "overdue":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const formatInvoiceId = (id: string): string => {
  return id.substring(0, 8).toUpperCase();
};

export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  return (
    invoice.status === "sent" &&
    isBefore(parseISO(invoice.due_date), new Date())
  );
};

export const calculateTotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
};

export const prepareForSupabase = (items: InvoiceItem[]): Json => {
  return items as unknown as Json;
};

export const generateInvoicePDF = async (invoice: DisplayInvoice) => {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  doc.setFont("helvetica");

  // Koormatics branding (load SVG via <img> to avoid CSP connect-src issues)
  const logoUrl = "/koormatics-logo.svg";
  const logoWidth = 42;
  const logoHeight = 12;
  try {
    const pngDataUrl: string = await new Promise((resolve, reject) => {
      const img = new Image();
      // Same-origin asset; no need for crossOrigin but set for safety
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Render at target PDF display size for crispness
        const targetScale = 3; // higher DPI
        canvas.width = Math.max(1, Math.floor(logoWidth * targetScale));
        canvas.height = Math.max(1, Math.floor(logoHeight * targetScale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas 2D context unavailable"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = (err) => reject(err);
      img.src = logoUrl;
    });
    doc.addImage(pngDataUrl, "PNG", margin, 15, logoWidth, logoHeight);
  } catch (e) {
    console.error("Error adding logo:", e);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
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

  // Header ribbon redesign
  doc.setFillColor(
    pdfColors.headerBg[0],
    pdfColors.headerBg[1],
    pdfColors.headerBg[2]
  );
  doc.rect(margin, 12, pageW - margin * 2, 12, "F");
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    pdfColors.headerText[0],
    pdfColors.headerText[1],
    pdfColors.headerText[2]
  );
  doc.text("Koormatics Invoice", pageW - margin - 2, 20, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(
    pdfColors.headerText[0],
    pdfColors.headerText[1],
    pdfColors.headerText[2]
  );
  doc.text("Official Tax Document", pageW - margin - 2, 27, { align: "right" });

  // Two professional info cards: Bill To (left) and Invoice Info (right)
  let yPos = 15 + logoHeight + 5 + companyInfoText.length * 5 + 8;
  const cardGap = 6;
  const cardW = (pageW - margin * 2 - cardGap) / 2;

  // Card styles
  const drawCard = (
    x: number,
    y: number,
    w: number,
    title: string,
    rows: Array<[string, string]>
  ) => {
    doc.setDrawColor(
      pdfColors.border[0],
      pdfColors.border[1],
      pdfColors.border[2]
    );
    doc.setFillColor(
      pdfColors.rowAlt[0],
      pdfColors.rowAlt[1],
      pdfColors.rowAlt[2]
    );
    const headerH = 8;
    // Header bar
    doc.roundedRect(x, y, w, headerH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(
      pdfColors.primary[0],
      pdfColors.primary[1],
      pdfColors.primary[2]
    );
    doc.setFontSize(10);
    doc.text(title, x + 3, y + 5.5);
    // Body
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    let rowY = y + headerH + 5;
    const labelW = 28;
    rows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, x + 3, rowY);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(value || "", w - labelW - 6);
      doc.text(wrapped, x + labelW, rowY);
      rowY += Math.max(6, doc.getTextDimensions(wrapped).h + 2);
    });
    return rowY;
  };

  const leftRows: Array<[string, string]> = [
    ["Client", invoice.client_name || ""],
  ];
  if (invoice.client_address)
    leftRows.push(["Address", invoice.client_address]);
  if (invoice.client_email) leftRows.push(["Email", invoice.client_email]);
  if (invoice.client_phone) leftRows.push(["Phone", invoice.client_phone]);

  const rightRows: Array<[string, string]> = [
    ["Invoice #", formatInvoiceId(invoice.id)],
    ["Date", formatDate(invoice.date)],
    ["Due Date", formatDate(invoice.due_date)],
    ["Status", formatStatus(invoice.status)],
  ];

  const leftCardBottom = drawCard(margin, yPos, cardW, "Bill To", leftRows);
  const rightCardBottom = drawCard(
    margin + cardW + cardGap,
    yPos,
    cardW,
    "Invoice Info",
    rightRows
  );

  // Build trip details into the first line item description (no separate table)
  let tableStartY = Math.max(leftCardBottom, rightCardBottom) + 8;
  try {
    const { data: trips } = await supabase
      .from("trips")
      .select(
        "id, date, pickup_location, dropoff_location, service_type, vehicle_type, soft_skin_count, armoured_count, has_security_escort, escort_count"
      )
      .eq("invoice_id", invoice.id);

    if (trips && trips.length > 0) {
      const tripLines = trips.map((t: any) => {
        const tripId = (t.id || "").toString().substring(0, 8).toUpperCase();
        const serviceLabel =
          tripTypeDisplayMap[t.service_type] ||
          (t.service_type || "").replace(/_/g, " ");
        const route = `${t.pickup_location || "N/A"} → ${
          t.dropoff_location || "N/A"
        }`;
        const vehicleBits: string[] = [];
        if (t.vehicle_type)
          vehicleBits.push(
            t.vehicle_type === "armoured" ? "Armoured" : "Soft Skin"
          );
        if (t.soft_skin_count)
          vehicleBits.push(`Soft Skin: ${t.soft_skin_count}`);
        if (t.armoured_count) vehicleBits.push(`Armoured: ${t.armoured_count}`);
        const vehicleInfo = vehicleBits.join(" | ") || "N/A";
        const escortInfo = t.has_security_escort
          ? `${t.escort_count || 1} escort vehicle(s)`
          : "None";
        return `Trip from ${t.pickup_location || "N/A"} to ${
          t.dropoff_location || "N/A"
        } on ${formatDate(t.date)} — Service: ${serviceLabel}; Vehicle: ${
          vehicleInfo || "N/A"
        }; Escort: ${escortInfo} (Trip ID: ${tripId})`;
      });

      const detailsBlock = tripLines.join("\n\n");
      (invoice as any).items = [
        {
          description: detailsBlock,
          quantity: "",
          unit_price: "",
          amount: 0,
        } as any,
        ...invoice.items,
      ];
    }
  } catch {}

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    tableWidth: "auto",
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: invoice.items.map((item) => [
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
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "normal", cellWidth: "auto" },
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "right", cellWidth: 24 },
      3: { halign: "right", cellWidth: 28 },
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2,
      overflow: "linebreak",
      textColor: [pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]],
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
    didDrawPage: function (data) {
      const pageNumber = doc.internal.getNumberOfPages();
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
      doc.text(
        "Thank you for your business!",
        margin,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Page ${pageNumber} of ${pageCount}`,
        pageW - margin,
        doc.internal.pageSize.height - 10,
        { align: "right" }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;
  let yPosTotals = finalY + 10;

  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = invoice.vat_percentage
    ? subtotal * (invoice.vat_percentage / 100)
    : 0;
  const discountAmount = invoice.discount_percentage
    ? subtotal * (invoice.discount_percentage / 100)
    : 0;
  const totalAmount = invoice.total_amount;
  const balanceDue = totalAmount - (invoice.paid_amount || 0);

  const totalsCardW = 80;
  const totalCol1 = pageW - margin - totalsCardW + 30;
  const totalCol2 = pageW - margin;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);

  doc.text("Subtotal:", totalCol1, yPosTotals, { align: "right" });
  doc.text(formatCurrency(subtotal), totalCol2, yPosTotals, { align: "right" });
  yPosTotals += 7;

  if (vatAmount > 0) {
    doc.text(`VAT (${invoice.vat_percentage}%)`, totalCol1, yPosTotals, {
      align: "right",
    });
    doc.text(formatCurrency(vatAmount), totalCol2, yPosTotals, {
      align: "right",
    });
    yPosTotals += 7;
  }

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

  // totals separator
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
  yPosTotals += 7;

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
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPosTotals > pageHeight - 100) {
    doc.addPage();
    yPosTotals = margin;
  }

  yPosTotals += 10;

  // Footer: professional payment and terms columns
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);

  const commText = `Please quote this reference with your payment: ${formatInvoiceId(
    invoice.id
  )}`;
  doc.text(commText, margin, yPosTotals);
  yPosTotals += 8;

  const colW = (pageW - margin * 2 - 8) / 2;
  const leftX = margin;
  const rightX = margin + colW + 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Bank Details", leftX, yPosTotals);
  doc.text("Terms and Conditions", rightX, yPosTotals);
  yPosTotals += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const bankLines = [
    "Dahabshil Bank",
    "Account Name: Peace Business Group",
    "Account Number: 104 102 369",
    "Swift Code: EABDDJJD",
    "Branch: Mogadishu, Somalia",
    "IBAN: SO600002301301008035901",
    "",
    "Premier Bank",
    "Account Name: Peace Business Group",
    "Account Number: 020600296001",
    "IBAN: SO600005002020600296001",
  ];
  doc.text(bankLines, leftX, yPosTotals);

  const terms = [
    "1. Invoices are due upon receipt unless otherwise specified.",
    "2. Late payments may be subject to additional charges.",
    "3. Services are provided as per agreed terms of engagement.",
  ];
  doc.text(terms, rightX, yPosTotals);

  doc.save(`Invoice-${formatInvoiceId(invoice.id)}.pdf`);

  toast({
    title: "Invoice PDF Generated",
    description: "Your invoice has been downloaded.",
  });
};

export const sendInvoiceByEmail = async (
  invoice: DisplayInvoice
): Promise<boolean> => {
  if (!invoice.client_email) {
    toast({
      title: "No Email Address",
      description: "This client doesn't have an email address.",
      variant: "destructive",
    });
    return false;
  }

  toast({
    title: "Sending PDF...",
    description: "Generating PDF and sending email to client",
  });

  try {
    const { error: invokeError } = await supabase.functions.invoke(
      "send-invoice",
      {
        body: {
          invoiceId: invoice.id,
          clientEmail: invoice.client_email,
          clientName: invoice.client_name,
        },
      }
    );

    if (invokeError) throw invokeError;

    // Update invoice status to sent
    const { error } = await supabase
      .from("invoices")
      .update({ status: "sent" as InvoiceStatus })
      .eq("id", invoice.id);

    if (error) throw error;

    toast({
      title: "PDF Sent Successfully",
      description: `Invoice PDF has been sent to ${invoice.client_email}`,
    });
    return true;
  } catch (error) {
    console.error("Error sending invoice PDF:", error);
    toast({
      title: "Failed to Send PDF",
      description:
        error instanceof Error
          ? error.message
          : "Failed to send the invoice PDF",
      variant: "destructive",
    });
    return false;
  }
};
