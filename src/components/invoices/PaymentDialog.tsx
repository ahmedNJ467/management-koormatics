
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DisplayInvoice, PaymentMethod } from "@/lib/types/invoice";
import { formatInvoiceId, formatCurrency } from "./utils/invoice-helpers";

interface PaymentDialogProps {
  invoice: DisplayInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment: () => void;
  paymentAmount: number;
  setPaymentAmount: React.Dispatch<React.SetStateAction<number>>;
  paymentMethod: PaymentMethod;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  paymentDate: string;
  setPaymentDate: React.Dispatch<React.SetStateAction<string>>;
  paymentNotes: string;
  setPaymentNotes: React.Dispatch<React.SetStateAction<string>>;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  onRecordPayment,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  paymentDate,
  setPaymentDate,
  paymentNotes,
  setPaymentNotes,
}) => {
  const resetForm = () => {
    setPaymentAmount(0);
    setPaymentMethod("bank_transfer");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentNotes("");
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice #{invoice ? formatInvoiceId(invoice.id) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment_amount">Payment Amount</Label>
            <Input 
              id="payment_amount" 
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              min="0.01"
              step="0.01"
              required
            />
            {invoice && (
              <div className="text-sm text-muted-foreground">
                Total: {formatCurrency(invoice.total_amount)}, 
                Previously Paid: {formatCurrency(invoice.paid_amount || 0)}, 
                Remaining: {formatCurrency(invoice.total_amount - (invoice.paid_amount || 0))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input 
              id="payment_date" 
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select 
              value={paymentMethod} 
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            >
              <SelectTrigger id="payment_method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_notes">Notes</Label>
            <Textarea 
              id="payment_notes" 
              placeholder="Add any notes about this payment"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onRecordPayment}
            disabled={paymentAmount <= 0}
          >
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
