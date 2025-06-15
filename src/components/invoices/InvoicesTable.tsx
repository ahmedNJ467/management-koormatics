
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Download, CreditCard, Send, Trash } from "lucide-react";
import { DisplayInvoice } from "@/lib/types/invoice";
import { formatInvoiceId, formatDate, formatCurrency, getStatusColor, formatStatus, generateInvoicePDF, sendInvoiceByEmail } from "@/lib/invoice-helpers";

interface InvoicesTableProps {
  invoices: DisplayInvoice[];
  onView: (invoice: DisplayInvoice) => void;
  onEdit: (invoice: DisplayInvoice) => void;
  onRecordPayment: (invoice: DisplayInvoice) => void;
  onDelete: (id: string) => void;
}

export function InvoicesTable({ invoices, onView, onEdit, onRecordPayment, onDelete }: InvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                No invoices found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{formatInvoiceId(invoice.id)}</TableCell>
              <TableCell>
                <div className="font-medium">{invoice.client_name}</div>
                <div className="text-sm text-muted-foreground">{invoice.client_email}</div>
              </TableCell>
              <TableCell>{formatDate(invoice.date)}</TableCell>
              <TableCell>{formatDate(invoice.due_date)}</TableCell>
              <TableCell>
                <div className="font-medium">{formatCurrency(invoice.total_amount)}</div>
                {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
                  <div className="text-sm text-muted-foreground">Paid: {formatCurrency(invoice.paid_amount)}</div>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(invoice.status)}>{formatStatus(invoice.status)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(invoice)}><FileText className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(invoice)}><FileText className="h-4 w-4 mr-2" />Edit Invoice</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => generateInvoicePDF(invoice)}><Download className="h-4 w-4 mr-2" />Download PDF</DropdownMenuItem>
                    {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                      <DropdownMenuItem onClick={() => onRecordPayment(invoice)}><CreditCard className="h-4 w-4 mr-2" />Record Payment</DropdownMenuItem>
                    )}
                    {invoice.status === "draft" && (
                      <DropdownMenuItem onClick={() => sendInvoiceByEmail(invoice)}><Send className="h-4 w-4 mr-2" />Send to Client</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(invoice.id)} className="text-red-600"><Trash className="h-4 w-4 mr-2" />Delete Invoice</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
