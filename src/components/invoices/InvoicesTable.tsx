import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  FileText,
  Download,
  CreditCard,
  Send,
  Trash,
  Eye,
  Edit,
  Mail,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { DisplayInvoice } from "@/lib/types/invoice";
import {
  formatInvoiceId,
  formatDate,
  formatCurrency,
  getStatusColor,
  formatStatus,
  generateInvoicePDF,
  sendInvoiceByEmail,
} from "@/lib/invoice-helpers";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface InvoicesTableProps {
  invoices: DisplayInvoice[];
  onView: (invoice: DisplayInvoice) => void;
  onEdit: (invoice: DisplayInvoice) => void;
  onRecordPayment: (invoice: DisplayInvoice) => void;
  onDelete: (id: string) => void;
}

export function InvoicesTable({
  invoices,
  onView,
  onEdit,
  onRecordPayment,
  onDelete,
}: InvoicesTableProps) {
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Edit className="h-3 w-3" />;
      case "sent":
        return <Mail className="h-3 w-3" />;
      case "paid":
        return <CheckCircle className="h-3 w-3" />;
      case "overdue":
        return <AlertCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const handleSendEmail = async (invoice: DisplayInvoice) => {
    if (!invoice.client_email) {
      toast({
        title: "No Email Address",
        description: "This client doesn't have an email address.",
        variant: "destructive",
      });
      return;
    }

    setSendingEmails((prev) => new Set(prev).add(invoice.id));

    try {
      const success = await sendInvoiceByEmail(invoice);
      if (success) {
        toast({
          title: "Email Sent",
          description: `Invoice sent to ${invoice.client_email}`,
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setSendingEmails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateDisplay = (invoice: DisplayInvoice) => {
    const daysUntilDue = getDaysUntilDue(invoice.due_date);

    if (invoice.status === "paid") {
      return (
        <div className="text-green-600 text-sm">
          <CheckCircle className="h-3 w-3 inline mr-1" />
          Paid
        </div>
      );
    }

    if (daysUntilDue < 0) {
      return (
        <div className="text-red-600 text-sm">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          {Math.abs(daysUntilDue)} days overdue
        </div>
      );
    }

    if (daysUntilDue === 0) {
      return (
        <div className="text-orange-600 text-sm">
          <Clock className="h-3 w-3 inline mr-1" />
          Due today
        </div>
      );
    }

    if (daysUntilDue <= 7) {
      return (
        <div className="text-orange-600 text-sm">
          <Clock className="h-3 w-3 inline mr-1" />
          Due in {daysUntilDue} days
        </div>
      );
    }

    return (
      <div className="text-muted-foreground text-sm">
        Due in {daysUntilDue} days
      </div>
    );
  };

  const getBalanceDue = (invoice: DisplayInvoice) => {
    return invoice.total_amount - (invoice.paid_amount || 0);
  };

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
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No invoices found</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first invoice to get started
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Invoice #</TableHead>
            <TableHead className="min-w-[200px]">Client</TableHead>
            <TableHead className="min-w-[100px]">Date</TableHead>
            <TableHead className="min-w-[140px]">Due Date</TableHead>
            <TableHead className="min-w-[120px] text-right">Amount</TableHead>
            <TableHead className="min-w-[120px] text-right">Balance</TableHead>
            <TableHead className="min-w-[120px]">Status</TableHead>
            <TableHead className="min-w-[60px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const balanceDue = getBalanceDue(invoice);
            const isOverdue = invoice.status === "overdue";
            const isPaid = invoice.status === "paid";

            return (
              <TableRow
                key={invoice.id}
                className={`hover:bg-muted/50 ${
                  isOverdue ? "bg-red-50 hover:bg-red-100" : ""
                }`}
              >
                <TableCell className="font-mono font-medium">
                  {formatInvoiceId(invoice.id)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{invoice.client_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.client_email}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(invoice.date)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {formatDate(invoice.due_date)}
                    </div>
                    {getDueDateDisplay(invoice)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    {invoice.paid_amount > 0 && (
                      <div className="text-xs text-green-600">
                        Paid: {formatCurrency(invoice.paid_amount)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className={`font-medium ${
                      isPaid
                        ? "text-green-600"
                        : balanceDue > 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatCurrency(balanceDue)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getStatusColor(
                      invoice.status
                    )} flex items-center gap-1 w-fit`}
                  >
                    {getStatusIcon(invoice.status)}
                    {formatStatus(invoice.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Invoice Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={() => onView(invoice)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onEdit(invoice)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Invoice
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => generateInvoicePDF(invoice)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>

                      {invoice.client_email && (
                        <DropdownMenuItem
                          onClick={() => handleSendEmail(invoice)}
                          disabled={sendingEmails.has(invoice.id)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sendingEmails.has(invoice.id)
                            ? "Sending PDF..."
                            : "Send PDF to Client"}
                        </DropdownMenuItem>
                      )}

                      {invoice.status !== "paid" &&
                        invoice.status !== "cancelled" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onRecordPayment(invoice)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                          </>
                        )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(invoice.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
