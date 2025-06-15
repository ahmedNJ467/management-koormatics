
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Plus, Trash, CreditCard, Download, Send, DollarSign, Check } from "lucide-react";
import { DisplayInvoice, InvoiceItem, PaymentMethod, InvoiceStatus, prepareForSupabase } from "@/lib/types/invoice";
import { Client } from "@/lib/types/client";
import { DisplayTrip } from "@/lib/types/trip";
import { supabase } from "@/integrations/supabase/client";
import { useInvoiceMutations } from "./hooks/useInvoiceMutations";
import { calculateTotal, formatCurrency, formatDate, formatStatus, getStatusColor, generateInvoicePDF, sendInvoiceByEmail } from "@/lib/invoice-helpers";

// Form Dialog Component
interface InvoiceFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editInvoice: DisplayInvoice | null;
  clients: Client[] | undefined;
}

export function InvoiceFormDialog({ isOpen, onOpenChange, editInvoice, clients }: InvoiceFormDialogProps) {
  const { saveInvoice, isSaving } = useInvoiceMutations();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const { data: availableTrips } = useQuery({
    queryKey: ["availableTrips", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const { data, error } = await supabase.from("trips").select(`*`).eq("client_id", selectedClientId).is("invoice_id", null);
      if (error) throw error;
      return data.map((trip: any) => ({ ...trip, type: trip.service_type || 'other' } as DisplayTrip));
    },
    enabled: !!selectedClientId,
  });

  useEffect(() => {
    if (editInvoice) {
      setSelectedClientId(editInvoice.client_id);
      setInvoiceItems(editInvoice.items.length > 0 ? editInvoice.items : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
      setVatEnabled(!!editInvoice.vat_percentage && editInvoice.vat_percentage > 0);
      setDiscountAmount(editInvoice.discount_amount || 0);
    } else {
      setSelectedClientId("");
      setSelectedTrips([]);
      setInvoiceItems([{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
      setVatEnabled(false);
      setDiscountAmount(0);
    }
  }, [editInvoice, isOpen]);

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      const quantity = updatedItems[index].quantity;
      const unitPrice = updatedItems[index].unit_price;
      updatedItems[index].amount = quantity * unitPrice;
    }
    setInvoiceItems(updatedItems);
  };

  const addInvoiceItem = () => setInvoiceItems([...invoiceItems, { description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  const removeInvoiceItem = (index: number) => { if (invoiceItems.length > 1) setInvoiceItems(invoiceItems.filter((_, i) => i !== index)); };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const subtotal = calculateTotal(invoiceItems);
    const vatAmount = vatEnabled ? subtotal * 0.05 : 0;
    const grandTotal = subtotal + vatAmount - (discountAmount || 0);

    const invoiceData = {
      client_id: formData.get("client_id") as string,
      date: formData.get("date") as string,
      due_date: formData.get("due_date") as string,
      status: (formData.get("status") as InvoiceStatus) || "draft",
      items: prepareForSupabase(invoiceItems),
      total_amount: grandTotal,
      paid_amount: editInvoice?.paid_amount || 0,
      notes: formData.get("notes") as string || undefined,
      vat_percentage: vatEnabled ? 5 : undefined,
      discount_amount: discountAmount > 0 ? discountAmount : undefined,
      ...(editInvoice ? { updated_at: new Date().toISOString() } : { created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
    };

    await saveInvoice({ invoiceData, editInvoice, selectedTrips });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>{editInvoice ? `Editing invoice for ${editInvoice.client_name}` : "Create a new invoice for a client."}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select name="client_id" value={selectedClientId} onValueChange={setSelectedClientId} disabled={!!editInvoice} required>
                  <SelectTrigger id="client_id"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients?.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="date">Invoice Date</Label><Input id="date" name="date" type="date" defaultValue={editInvoice?.date || format(new Date(), "yyyy-MM-dd")} required /></div>
              <div className="space-y-2"><Label htmlFor="due_date">Due Date</Label><Input id="due_date" name="due_date" type="date" defaultValue={editInvoice?.due_date || format(addDays(new Date(), 30), "yyyy-MM-dd")} required /></div>
            </div>
            {!editInvoice && selectedClientId && (
                <div className="space-y-2 border p-4 rounded-md">
                    <Label>Select Trips to Invoice</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {availableTrips?.map((trip) => (
                            <div key={trip.id} className="flex items-center space-x-2 p-2 border rounded-md">
                                <Checkbox id={`trip-${trip.id}`} checked={selectedTrips.includes(trip.id)} onCheckedChange={(checked) => {
                                    const description = `Trip from ${trip.pickup_location} to ${trip.dropoff_location} on ${format(new Date(trip.date), "yyyy-MM-dd")}`;
                                    if(checked) {
                                        setSelectedTrips([...selectedTrips, trip.id]);
                                        setInvoiceItems(items => [...items.filter(i => i.description), { description, quantity: 1, unit_price: trip.amount || 0, amount: trip.amount || 0 }]);
                                    } else {
                                        setSelectedTrips(selectedTrips.filter(id => id !== trip.id));
                                        const newItems = invoiceItems.filter(item => item.description !== description);
                                        setInvoiceItems(newItems.length > 0 ? newItems : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }]);
                                    }
                                }}/>
                                <div className="flex-1"><Label htmlFor={`trip-${trip.id}`}>{format(new Date(trip.date), "MMM d, yyyy")}: {trip.pickup_location} to {trip.dropoff_location}</Label></div>
                                <div>{formatCurrency(trip.amount || 0)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2"><Label>Invoice Items</Label><Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}><Plus className="h-4 w-4 mr-1" /> Add</Button></div>
              <div className="space-y-2">
                {invoiceItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5"><Input placeholder="Description" value={item.description} onChange={(e) => updateInvoiceItem(index, "description", e.target.value)} required /></div>
                    <div className="col-span-2"><Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateInvoiceItem(index, "quantity", parseFloat(e.target.value) || 1)} min="1" required /></div>
                    <div className="col-span-2"><Input type="number" placeholder="Unit Price" value={item.unit_price} onChange={(e) => updateInvoiceItem(index, "unit_price", parseFloat(e.target.value) || 0)} min="0" step="0.01" required /></div>
                    <div className="col-span-2 flex h-10 items-center px-3 border rounded-md bg-muted">{formatCurrency(item.amount)}</div>
                    <div className="col-span-1 flex justify-center">{invoiceItems.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeInvoiceItem(index)}><Trash className="h-4 w-4" /></Button>}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <div className="w-[250px] space-y-1">
                <div className="flex justify-between text-sm"><span>Subtotal:</span><span>{formatCurrency(calculateTotal(invoiceItems))}</span></div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2"><Checkbox id="vat" checked={vatEnabled} onCheckedChange={(c) => setVatEnabled(c as boolean)} /><Label htmlFor="vat">VAT (5%)</Label></div>
                  <span>{formatCurrency(vatEnabled ? calculateTotal(invoiceItems) * 0.05 : 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Label htmlFor="discount">Discount:</Label>
                  <Input id="discount" type="number" value={discountAmount || ""} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} className="h-8 text-right w-24" />
                </div>
                <div className="flex justify-between font-medium pt-2 border-t mt-2"><span>Total:</span><span>{formatCurrency(calculateTotal(invoiceItems) + (vatEnabled ? calculateTotal(invoiceItems) * 0.05 : 0) - (discountAmount || 0))}</span></div>
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" defaultValue={editInvoice?.notes || ""} /></div>
            {editInvoice && (<div className="space-y-2"><Label htmlFor="status">Status</Label><Select name="status" defaultValue={editInvoice.status}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div>)}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : (editInvoice ? "Update Invoice" : "Create Invoice")}</Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


// View Dialog Component
interface ViewInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: DisplayInvoice | null;
  onRecordPayment: (invoice: DisplayInvoice) => void;
}
export function ViewInvoiceDialog({ isOpen, onOpenChange, invoice, onRecordPayment }: ViewInvoiceDialogProps) {
  if (!invoice) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader><DialogTitle>Invoice Details</DialogTitle><Badge className={getStatusColor(invoice.status)}>{formatStatus(invoice.status)}</Badge></DialogHeader>
        <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
           <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div><h3 className="text-sm font-medium mb-1">Client</h3><p>{invoice.client_name}</p><p className="text-muted-foreground">{invoice.client_address}</p><p className="text-muted-foreground">{invoice.client_email}</p></div>
                  <div><h3 className="text-sm font-medium mb-1">Details</h3><p>Date: {formatDate(invoice.date)}</p><p>Due: {formatDate(invoice.due_date)}</p></div>
                </div>
                <div><h3 className="text-sm font-medium mb-2">Items</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                    <TableBody>{invoice.items.map((item, i) => <TableRow key={i}><TableCell>{item.description}</TableCell><TableCell className="text-right">{formatCurrency(item.amount)}</TableCell></TableRow>)}</TableBody>
                    <TableFooter>
                      {invoice.vat_percentage && <TableRow><TableCell colSpan={1} className="text-right">VAT ({invoice.vat_percentage}%)</TableCell><TableCell className="text-right">{formatCurrency(calculateTotal(invoice.items) * (invoice.vat_percentage/100))}</TableCell></TableRow>}
                      {invoice.discount_amount && <TableRow><TableCell colSpan={1} className="text-right">Discount</TableCell><TableCell className="text-right">-{formatCurrency(invoice.discount_amount)}</TableCell></TableRow>}
                      <TableRow><TableCell colSpan={1} className="text-right font-bold">Total</TableCell><TableCell className="text-right font-bold">{formatCurrency(invoice.total_amount)}</TableCell></TableRow>
                      {invoice.paid_amount > 0 && <TableRow><TableCell colSpan={1} className="text-right font-bold">Paid</TableCell><TableCell className="text-right font-bold text-green-600">{formatCurrency(invoice.paid_amount)}</TableCell></TableRow>}
                      <TableRow><TableCell colSpan={1} className="text-right font-bold">Balance Due</TableCell><TableCell className="text-right font-bold">{formatCurrency(invoice.total_amount - invoice.paid_amount)}</TableCell></TableRow>
                    </TableFooter>
                  </Table>
                </div>
                {invoice.notes && <div><h3 className="text-sm font-medium mb-1">Notes</h3><p className="text-sm text-muted-foreground">{invoice.notes}</p></div>}
              </div>
        </ScrollArea>
        <DialogFooter className="gap-2">
          {invoice.status !== "paid" && invoice.status !== "cancelled" && <Button onClick={() => { onRecordPayment(invoice); onOpenChange(false); }}><CreditCard className="mr-2 h-4 w-4" />Record Payment</Button>}
          <Button variant="outline" onClick={() => generateInvoicePDF(invoice)}><Download className="mr-2 h-4 w-4" />PDF</Button>
          {invoice.status === "draft" && <Button onClick={() => sendInvoiceByEmail(invoice)}><Send className="mr-2 h-4 w-4" />Send</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Payment Dialog Component
interface RecordPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: DisplayInvoice | null;
}
export function RecordPaymentDialog({ isOpen, onOpenChange, invoice }: RecordPaymentDialogProps) {
  const { recordPayment, isRecordingPayment } = useInvoiceMutations();
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.total_amount - (invoice.paid_amount || 0));
    }
  }, [invoice]);

  const handleRecord = async () => {
    if (!invoice) return;
    await recordPayment({ invoice, amount, method, date, notes });
    onOpenChange(false);
  };

  if (!invoice) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>For invoice {invoice.id.substring(0,8)}</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label htmlFor="paymentAmount">Amount</Label><div className="relative"><DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="paymentAmount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} className="pl-9" /></div></div>
          <div className="space-y-2"><Label htmlFor="paymentMethod">Method</Label><Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="credit_card">Credit Card</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="paymentDate">Date</Label><Input id="paymentDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="paymentNotes">Notes</Label><Textarea id="paymentNotes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRecordingPayment}>Cancel</Button>
          <Button onClick={handleRecord} disabled={isRecordingPayment}><Check className="mr-2 h-4 w-4" />{isRecordingPayment ? "Recording..." : "Record Payment"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Dialog Component
interface DeleteInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
export function DeleteInvoiceDialog({ isOpen, onOpenChange, onConfirm }: DeleteInvoiceDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this invoice and unlink any associated trips.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
