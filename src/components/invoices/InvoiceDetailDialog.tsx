
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Download, CreditCard } from "lucide-react";
import { DisplayInvoice } from "@/lib/types/invoice";
import { formatInvoiceId, formatStatus, formatDate, formatCurrency, getStatusColor } from "./utils/invoice-helpers";

interface InvoiceDetailDialogProps {
  invoice: DisplayInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (invoice: DisplayInvoice) => void;
  onDelete: (invoiceId: string) => void;
  onRecordPayment: (invoice: DisplayInvoice) => void;
  onGeneratePDF: (invoice: DisplayInvoice) => void;
}

export const InvoiceDetailDialog: React.FC<InvoiceDetailDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onRecordPayment,
  onGeneratePDF,
}) => {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl">
                Invoice #{formatInvoiceId(invoice.id)}
              </DialogTitle>
              <DialogDescription>
                Created on {formatDate(invoice.date)}
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(invoice.status)}>
              {formatStatus(invoice.status)}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-160px)]">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Bill To</h3>
                <p className="text-sm font-medium">{invoice.client_name}</p>
                {invoice.client_address && (
                  <p className="text-sm">{invoice.client_address}</p>
                )}
                {invoice.client_email && (
                  <p className="text-sm">{invoice.client_email}</p>
                )}
                {invoice.client_phone && (
                  <p className="text-sm">{invoice.client_phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Invoice Details</h3>
                <p className="text-sm">
                  <span className="font-medium">Invoice Date:</span> {formatDate(invoice.date)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Due Date:</span> {formatDate(invoice.due_date)}
                </p>
                {invoice.payment_date && (
                  <p className="text-sm">
                    <span className="font-medium">Payment Date:</span> {formatDate(invoice.payment_date)}
                  </p>
                )}
                {invoice.payment_method && (
                  <p className="text-sm">
                    <span className="font-medium">Payment Method:</span> {invoice.payment_method.replace(/_/g, " ")}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Invoice Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                  </TableRow>
                  {invoice.paid_amount > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right">Paid</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.paid_amount)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Balance Due</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total_amount - invoice.paid_amount)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableFooter>
              </Table>
            </div>

            {invoice.trips && invoice.trips.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Related Trips</h3>
                <div className="space-y-2">
                  {invoice.trips.map((trip) => (
                    <Card key={trip.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{formatDate(trip.date)}</div>
                          <div className="text-sm text-muted-foreground">
                            {trip.pickup_location && trip.dropoff_location ? (
                              <span>{trip.pickup_location} to {trip.dropoff_location}</span>
                            ) : (
                              <span>{trip.pickup_location || trip.dropoff_location}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {trip.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Notes</h3>
                <div className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">
                  {invoice.notes}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onGeneratePDF(invoice)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <Button 
                variant="outline"
                onClick={() => onRecordPayment(invoice)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => onEdit(invoice)}
            >
              Edit
            </Button>
            <Button 
              variant="destructive"
              onClick={() => onDelete(invoice.id)}
            >
              Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
