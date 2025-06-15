
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DisplayQuotation } from "@/lib/types/quotation";
import { pdfColors } from "@/components/reports/utils/pdf/pdfStyles";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, formatInvoiceId as formatQuotationId } from "@/lib/invoice-helpers";

export const generateQuotationPDF = (quotation: DisplayQuotation) => {
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
    doc.setTextColor(...pdfColors.text);
    const companyInfoText = [
        'Wadajir district.',
        'Airport Road, Mogadishu, Somalia',
        'www.koormatics.com',
        '+252-619494974'
    ];
    doc.text(companyInfoText, margin, 15 + logoHeight + 5);

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...pdfColors.primary);
    doc.text("QUOTATION", pageW - margin, 25, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...pdfColors.text);
    let yPosHeader = 35;
    doc.text(`Quotation #: ${formatQuotationId(quotation.id)}`, pageW - margin, yPosHeader, { align: 'right' });
    yPosHeader += 6;
    doc.text(`Date: ${formatDate(quotation.date)}`, pageW - margin, yPosHeader, { align: 'right' });
    yPosHeader += 6;
    doc.text(`Valid Until: ${formatDate(quotation.valid_until)}`, pageW - margin, yPosHeader, { align: 'right' });
    
    let yPos = 15 + logoHeight + 5 + (companyInfoText.length * 5) + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...pdfColors.primary);
    doc.text("BILL TO", margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...pdfColors.text);
    yPos += 5;
    doc.text(quotation.client_name, margin, yPos);
    yPos += 5;
    if (quotation.client_address) {
        const addressLines = doc.splitTextToSize(quotation.client_address, 80);
        doc.text(addressLines, margin, yPos);
        yPos += (doc.getTextDimensions(addressLines).h);
    }
    if (quotation.client_email) {
        doc.text(quotation.client_email, margin, yPos);
        yPos += 5;
    }
    if (quotation.client_phone) {
        doc.text(quotation.client_phone, margin, yPos);
    }
    
    const tableStartY = Math.max(yPos, 70) + 15;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: quotation.items.map(item => [
        item.description,
        item.quantity,
        formatCurrency(item.unit_price),
        formatCurrency(item.amount)
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: pdfColors.headerBg, 
        textColor: pdfColors.headerText,
        fontStyle: 'bold'
      },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        textColor: pdfColors.text,
        lineColor: pdfColors.border
      },
      alternateRowStyles: {
        fillColor: pdfColors.rowAlt
      },
      didDrawPage: function (data) {
        const pageNumber = (doc as any).internal.getCurrentPageInfo().pageNumber;
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(...pdfColors.text);
        doc.text('Thank you for your business!', margin, doc.internal.pageSize.height - 10);
        doc.text(`Page ${pageNumber} of ${pageCount}`, pageW - margin, doc.internal.pageSize.height - 10, { align: 'right' });
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    let yPosTotals = finalY + 10;
    
    const subtotal = quotation.items.reduce((sum, item) => sum + item.amount, 0);
    const vatAmount = quotation.vat_percentage ? subtotal * (quotation.vat_percentage / 100) : 0;
    const discountAmount = quotation.discount_percentage ? subtotal * (quotation.discount_percentage / 100) : 0;
    const totalAmount = quotation.total_amount;

    const totalCol1 = pageW - margin - 50;
    const totalCol2 = pageW - margin;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...pdfColors.text);

    doc.text('Subtotal:', totalCol1, yPosTotals, { align: 'right' });
    doc.text(formatCurrency(subtotal), totalCol2, yPosTotals, { align: 'right' });
    yPosTotals += 7;

    if (vatAmount > 0) {
      doc.text(`VAT (${quotation.vat_percentage}%)`, totalCol1, yPosTotals, { align: 'right' });
      doc.text(formatCurrency(vatAmount), totalCol2, yPosTotals, { align: 'right' });
      yPosTotals += 7;
    }

    if (discountAmount > 0) {
      doc.text(`Discount (${quotation.discount_percentage}%):`, totalCol1, yPosTotals, { align: 'right' });
      doc.text(`-${formatCurrency(discountAmount)}`, totalCol2, yPosTotals, { align: 'right' });
      yPosTotals += 7;
    }
    
    doc.setDrawColor(...pdfColors.border);
    doc.line(totalCol1 - 5, yPosTotals - 3, totalCol2, yPosTotals - 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...pdfColors.primary);
    doc.text('Total:', totalCol1, yPosTotals, { align: 'right' });
    doc.text(formatCurrency(totalAmount), totalCol2, yPosTotals, { align: 'right' });
    yPosTotals += 15;

    if (quotation.notes) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...pdfColors.primary);
      doc.text('Notes:', margin, yPosTotals);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...pdfColors.text);
      const splitNotes = doc.splitTextToSize(quotation.notes, pageW - (margin * 2));
      doc.text(splitNotes, margin, yPosTotals + 5);
    }
    
    doc.save(`Quotation-${formatQuotationId(quotation.id)}.pdf`);

    toast({
      title: "Quotation PDF Generated",
      description: "Your quotation has been downloaded.",
    });
};
