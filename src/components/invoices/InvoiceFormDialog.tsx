
import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useAvailableTripsQuery } from "./hooks/use-invoices-query";
import { DisplayInvoice, InvoiceItem, InvoiceStatus } from "@/lib/types/invoice";
import { Client } from "@/components/clients/hooks/use-clients-query";
import { DisplayTrip } from "@/lib/types/trip";
import { formatDate, formatCurrency } from "./utils/invoice-helpers";

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  invoiceItems: InvoiceItem[];
  setInvoiceItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  selectedTrips: string[];
  setSelectedTrips: React.Dispatch<React.SetStateAction<string[]>>;
  editInvoice: DisplayInvoice | null;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
  open,
  onOpenChange,
  clients,
  selectedClientId,
  onClientChange,
  invoiceItems,
  setInvoiceItems,
  selectedTrips,
  setSelectedTrips,
  editInvoice,
  onSave,
  onCancel,
}) => {
  const { data: availableTrips } = useAvailableTripsQuery(selectedClientId);

  // Update invoice item amount when quantity or unit price changes
  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amount if quantity or unit_price changed
    if (field === "quantity" || field === "unit_price") {
      const quantity = field === "quantity" ? value : updatedItems[index].quantity;
      const unitPrice = field === "unit_price" ? value : updatedItems[index].unit_price;
      updatedItems[index].amount = quantity * unitPrice;
    }
    
    setInvoiceItems(updatedItems);
  };

  // Add a new invoice item
  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  // Remove an invoice item
  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length <= 1) return; // Keep at least one item
    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updatedItems);
  };

  // Calculate total
  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {editInvoice 
              ? `Edit invoice details for ${editInvoice.client_name}`
              : "Create a new invoice for a client"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="pr-4 max-h-[calc(90vh-8rem)]">
          <form onSubmit={onSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select 
                name="client_id" 
                value={editInvoice?.client_id || selectedClientId}
                onValueChange={onClientChange}
                disabled={!!editInvoice}
                required
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Invoice Date</Label>
                <Input 
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={editInvoice?.date || format(new Date(), "yyyy-MM-dd")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input 
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={editInvoice?.due_date || format(addDays(new Date(), 30), "yyyy-MM-dd")}
                  required
                />
              </div>
            </div>

            {!editInvoice && selectedClientId && (
              <div className="space-y-2 border p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <Label>Select Trips to Invoice</Label>
                  <span className="text-sm text-muted-foreground">
                    {selectedTrips.length} selected
                  </span>
                </div>
                
                {!availableTrips || availableTrips.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No uninvoiced trips available for this client
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {availableTrips.map((trip) => (
                      <div key={trip.id} className="flex items-center space-x-2 p-2 border rounded-md">
                        <Checkbox 
                          id={`trip-${trip.id}`}
                          checked={selectedTrips.includes(trip.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTrips([...selectedTrips, trip.id]);
                              
                              // Add trip as an invoice item
                              const tripDate = format(new Date(trip.date), "MMM d, yyyy");
                              const description = `Transportation service on ${tripDate}`;
                              const amount = trip.amount || 0;
                              
                              setInvoiceItems([
                                ...invoiceItems,
                                { 
                                  description, 
                                  quantity: 1, 
                                  unit_price: amount, 
                                  amount 
                                }
                              ]);
                            } else {
                              setSelectedTrips(selectedTrips.filter(id => id !== trip.id));
                              
                              // Remove corresponding invoice item (if we can identify it)
                              const tripDate = format(new Date(trip.date), "MMM d, yyyy");
                              const itemIndex = invoiceItems.findIndex(
                                item => item.description.includes(tripDate)
                              );
                              
                              if (itemIndex !== -1) {
                                const updatedItems = [...invoiceItems];
                                updatedItems.splice(itemIndex, 1);
                                setInvoiceItems(updatedItems);
                              }
                            }
                          }}
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`trip-${trip.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {formatDate(trip.date)}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {trip.pickup_location && trip.dropoff_location ? (
                              <span>{trip.pickup_location} to {trip.dropoff_location}</span>
                            ) : (
                              <span>{trip.pickup_location || trip.dropoff_location}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(trip.amount || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <Label>Invoice Items</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addInvoiceItem}
                  className="h-8 px-2"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-2">
                {invoiceItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input 
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateInvoiceItem(index, "description", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(index, "quantity", parseFloat(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => updateInvoiceItem(index, "unit_price", parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {invoiceItems.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeInvoiceItem(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-2">
                <div className="w-1/3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                name="notes"
                placeholder="Add any notes or payment instructions"
                defaultValue={editInvoice?.notes || ""}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={editInvoice?.status || "draft"} required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {editInvoice ? "Save Changes" : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
