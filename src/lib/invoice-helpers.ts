
import { format, isBefore, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DisplayInvoice, Invoice, InvoiceStatus, InvoiceItem, Json } from "@/lib/types/invoice";
import { pdfColors } from "@/components/reports/utils/pdf/pdfStyles";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const formatStatus = (status: InvoiceStatus | undefined): string => {
  if (!status) return "Unknown";
  
  return status.replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
    return format(new Date(dateStr), "MMM d, yyyy");
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

export const generateInvoicePDF = (invoice: DisplayInvoice) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;

    doc.setFont('helvetica');

    const logoPath = '/lovable-uploads/6996f29f-4f5b-4a22-ba41-51dc5c98afb7.png';
    const logoAspectRatio = 123 / 622;
    const logoWidth = 50;
    const logoHeight = logoWidth * logoAspectRatio;
    try {
      doc.addImage(logoPath, 'PNG', margin, 15, logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo:", e);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("Koormatics", margin, 25);
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    const companyInfoText = [
        'Wadajir district.',
        'Airport Road, Mogadishu, Somalia',
        'www.koormatics.com',
        '+252-619494974'
    ];
    doc.text(companyInfoText, margin, 15 + logoHeight + 5);

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("INVOICE", pageW - margin, 25, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    let yPosHeader = 35;
    doc.text(`Invoice #: ${formatInvoiceId(invoice.id)}`, pageW - margin, yPosHeader, { align: 'right' });
    yPosHeader += 6;
    doc.text(`Date: ${formatDate(invoice.date)}`, pageW - margin, yPosHeader, { align: 'right' });
    yPosHeader += 6;
    doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageW - margin, yPosHeader, { align: 'right' });
    
    let yPos = 15 + logoHeight + 5 + (companyInfoText.length * 5) + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text("BILL TO", margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    yPos += 5;
    doc.text(invoice.client_name, margin, yPos);
    yPos += 5;
    if (invoice.client_address) {
        const addressLines = doc.splitTextToSize(invoice.client_address, 80);
        doc.text(addressLines, margin, yPos);
        yPos += (doc.getTextDimensions(addressLines).h);
    }
    if (invoice.client_email) {
        doc.text(invoice.client_email, margin, yPos);
        yPos += 5;
    }
    if (invoice.client_phone) {
        doc.text(invoice.client_phone, margin, yPos);
    }
    
    const tableStartY = Math.max(yPos, 70) + 15;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: invoice.items.map(item => [
        item.description,
        item.quantity,
        formatCurrency(item.unit_price),
        formatCurrency(item.amount)
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: [pdfColors.headerBg[0], pdfColors.headerBg[1], pdfColors.headerBg[2]], 
        textColor: [pdfColors.headerText[0], pdfColors.headerText[1], pdfColors.headerText[2]],
        fontStyle: 'bold'
      },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        textColor: [pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]],
        lineColor: [pdfColors.border[0], pdfColors.border[1], pdfColors.border[2]]
      },
      alternateRowStyles: {
        fillColor: [pdfColors.rowAlt[0], pdfColors.rowAlt[1], pdfColors.rowAlt[2]]
      },
      didDrawPage: function (data) {
        const pageNumber = doc.internal.getNumberOfPages();
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
        doc.text('Thank you for your business!', margin, doc.internal.pageSize.height - 10);
        doc.text(`Page ${pageNumber} of ${pageCount}`, pageW - margin, doc.internal.pageSize.height - 10, { align: 'right' });
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    let yPosTotals = finalY + 10;
    
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const vatAmount = invoice.vat_percentage ? subtotal * (invoice.vat_percentage / 100) : 0;
    const discountAmount = invoice.discount_percentage ? subtotal * (invoice.discount_percentage / 100) : 0;
    const totalAmount = invoice.total_amount;
    const balanceDue = totalAmount - (invoice.paid_amount || 0);

    const totalCol1 = pageW - margin - 50;
    const totalCol2 = pageW - margin;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);

    doc.text('Subtotal:', totalCol1, yPosTotals, { align: 'right' });
    doc.text(formatCurrency(subtotal), totalCol2, yPosTotals, { align: 'right' });
    yPosTotals += 7;

    if (vatAmount > 0) {
      doc.text(`VAT (${invoice.vat_percentage}%)`, totalCol1, yPosTotals, { align: 'right' });
      doc.text(formatCurrency(vatAmount), totalCol2, yPosTotals, { align: 'right' });
      yPosTotals += 7;
    }

    if (discountAmount > 0) {
      doc.text(`Discount (${invoice.discount_percentage}%):`, totalCol1, yPosTotals, { align: 'right' });
      doc.text(`-${formatCurrency(discountAmount)}`, totalCol2, yPosTotals, { align: 'right' });
      yPosTotals += 7;
    }
    
    doc.setDrawColor(pdfColors.border[0], pdfColors.border[1], pdfColors.border[2]);
    doc.line(totalCol1 - 5, yPosTotals - 3, totalCol2, yPosTotals - 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
    doc.text('Total:', totalCol1, yPosTotals, { align: 'right' });
    doc.text(formatCurrency(totalAmount), totalCol2, yPosTotals, { align: 'right' });
    yPosTotals += 7;
    
    if (invoice.paid_amount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
      doc.text('Amount Paid:', totalCol1, yPosTotals, { align: 'right' });
      doc.text(`-${formatCurrency(invoice.paid_amount)}`, totalCol2, yPosTotals, { align: 'right' });
      yPosTotals += 7;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      doc.text('Balance Due:', totalCol1, yPosTotals, { align: 'right' });
      doc.text(formatCurrency(balanceDue), totalCol2, yPosTotals, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      doc.text('Balance Due:', totalCol1, yPosTotals, { align: 'right' });
      doc.text(formatCurrency(balanceDue), totalCol2, yPosTotals, { align: 'right' });
    }
    
    yPosTotals += 15;

    if (invoice.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(pdfColors.primary[0], pdfColors.primary[1], pdfColors.primary[2]);
      doc.text('Notes:', margin, yPosTotals);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
      const splitNotes = doc.splitTextToSize(invoice.notes, pageW - (margin * 2));
      doc.text(splitNotes, margin, yPosTotals + 5);
    }
    
    const pageHeight = doc.internal.pageSize.getHeight();
    if (yPosTotals > pageHeight - 100) {
        doc.addPage();
        yPosTotals = margin;
    }
    
    yPosTotals += 10;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(pdfColors.text[0], pdfColors.text[1], pdfColors.text[2]);
    
    const commText = `Please use the following communication for your payment : ${formatInvoiceId(invoice.id)}`;
    doc.text(commText, margin, yPosTotals);
    yPosTotals += 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms and conditions', margin, yPosTotals);
    yPosTotals += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const terms = [
      '1. The quotation provided is valid for a period of thirty (30) days from the date of issue unless otherwise stated',
      '2. For all clients without an account or contract with us, a 50% down payment of the quoted amount, payable by cash or',
      '   bank transfer, is required to confirm bookings.',
      '3. Payment for services is due upon receipt of invoice, unless otherwise specified.'
    ];
    doc.text(terms, margin, yPosTotals);
    yPosTotals += (terms.length * 3.5) + 5;
    
    doc.text('"Thank you for your business."', margin, yPosTotals);
    yPosTotals += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Dahabshil Bank', margin, yPosTotals);
    yPosTotals += 4;
    doc.setFont('helvetica', 'normal');
    const dahabshilDetails = [
      'Account Name: Peace Business Group',
      'Account Number: 104 102 369',
      'Swift Codes: EABDDJJD',
      'Branch: Mogadishu, Somalia',
      'IBAN:SO600002301301008035901'
    ];
    doc.text(dahabshilDetails, margin, yPosTotals);
    yPosTotals += (dahabshilDetails.length * 3.5) + 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Premier Bank', margin, yPosTotals);
    yPosTotals += 4;
    doc.setFont('helvetica', 'normal');
    const premierDetails = [
      'Account Name: Peace Business Group',
      'Account Number: 020600296001',
      'IBAN: SO600005002020600296001'
    ];
    doc.text(premierDetails, margin, yPosTotals);
    
    doc.save(`Invoice-${formatInvoiceId(invoice.id)}.pdf`);

    toast({
      title: "Invoice PDF Generated",
      description: "Your invoice has been downloaded.",
    });
};

export const sendInvoiceByEmail = async (invoice: DisplayInvoice): Promise<boolean> => {
  if (!invoice.client_email) {
    toast({
      title: "Error",
      description: "Client does not have an email address.",
      variant: "destructive",
    });
    return false;
  }

  try {
    const { error: invokeError } = await supabase.functions.invoke('send-invoice', {
      body: {
        invoiceId: invoice.id,
        clientEmail: invoice.client_email,
        clientName: invoice.client_name,
      }
    });

    if (invokeError) throw invokeError;

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'sent' as InvoiceStatus })
      .eq('id', invoice.id);

    if (error) throw error;

    toast({
      title: "Invoice sent",
      description: `The invoice has been sent to ${invoice.client_email}`,
    });
    return true;
  } catch (error) {
    console.error("Error sending invoice:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to send the invoice",
      variant: "destructive",
    });
    return false;
  }
};
