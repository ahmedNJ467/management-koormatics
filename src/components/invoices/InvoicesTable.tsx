
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Send,
  Download,
  MoreHorizontal,
  CreditCard,
  Trash,
} from "lucide-react";
import { DisplayInvoice } from "@/lib/types/invoice";
import { formatInvoiceId, formatStatus, formatDate, formatCurrency, getStatusColor } from "./utils/invoice-helpers";

interface InvoicesTableProps {
  invoices: DisplayInvoice[];
  onViewInvoice: (invoice: DisplayInvoice) => void;
  onEditInvoice: (invoice: DisplayInvoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onRecordPayment: (invoice: DisplayInvoice) => void;
  onGeneratePDF: (invoice: DisplayInvoice) => void;
  onSendEmail: (invoice: DisplayInvoice) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onRecordPayment,
  onGeneratePDF,
  onSendEmail,
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
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
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                No invoices found. Try adjusting your search or create a new invoice.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id} className="group">
                <TableCell className="font-medium">
                  {formatInvoiceId(invoice.id)}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{invoice.client_name}</div>
                  {invoice.client_email && (
                    <div className="text-sm text-muted-foreground">{invoice.client_email}</div>
                  )}
                </TableCell>
                <TableCell>{formatDate(invoice.date)}</TableCell>
                <TableCell>{formatDate(invoice.due_date)}</TableCell>
                <TableCell>
                  <div className="font-medium">{formatCurrency(invoice.total_amount)}</div>
                  {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
                    <div className="text-sm text-muted-foreground">
                      Paid: {formatCurrency(invoice.paid_amount)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(invoice.status)}>
                    {formatStatus(invoice.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewInvoice(invoice)}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewInvoice(invoice)}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditInvoice(invoice)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Edit Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onGeneratePDF(invoice)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        
                        {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                          <DropdownMenuItem onClick={() => onRecordPayment(invoice)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Record Payment
                          </DropdownMenuItem>
                        )}
                        
                        {invoice.status === "draft" && (
                          <DropdownMenuItem onClick={() => onSendEmail(invoice)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send to Client
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => onDeleteInvoice(invoice.id)}
                          className="text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
