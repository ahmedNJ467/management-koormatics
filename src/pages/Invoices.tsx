
import { useState } from "react";
import { useInvoices } from "@/components/invoices/hooks/useInvoices";
import { useInvoiceMutations } from "@/components/invoices/hooks/useInvoiceMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { InvoiceFormDialog, ViewInvoiceDialog, RecordPaymentDialog, DeleteInvoiceDialog } from "@/components/invoices/InvoiceDialogs";
import { DisplayInvoice } from "@/lib/types/invoice";

export default function Invoices() {
  const { invoices, clients, filteredInvoices, isLoading, searchTerm, setSearchTerm, statusFilter, setStatusFilter } = useInvoices();
  const { deleteInvoice } = useInvoiceMutations();

  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<DisplayInvoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<DisplayInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<DisplayInvoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleEdit = (invoice: DisplayInvoice) => {
    setEditInvoice(invoice);
    setCreateInvoiceOpen(true);
  };
  
  const handleCreateOpen = () => {
    setEditInvoice(null);
    setCreateInvoiceOpen(true);
  }

  const handleDelete = (id: string) => {
    setInvoiceToDelete(id);
  }

  const confirmDelete = () => {
    if(invoiceToDelete) {
        deleteInvoice(invoiceToDelete);
        setInvoiceToDelete(null);
        if (viewInvoice?.id === invoiceToDelete) setViewInvoice(null);
        if (editInvoice?.id === invoiceToDelete) setEditInvoice(null);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage client invoices and payments</p>
        </div>
        <Button onClick={handleCreateOpen}>
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <InvoicesTable
        invoices={filteredInvoices || []}
        onView={setViewInvoice}
        onEdit={handleEdit}
        onRecordPayment={setPaymentInvoice}
        onDelete={handleDelete}
      />

      <InvoiceFormDialog
        isOpen={createInvoiceOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateInvoiceOpen(false);
            setEditInvoice(null);
          } else {
            setCreateInvoiceOpen(true);
          }
        }}
        editInvoice={editInvoice}
        clients={clients}
      />
      
      <ViewInvoiceDialog
        isOpen={!!viewInvoice}
        onOpenChange={() => setViewInvoice(null)}
        invoice={viewInvoice}
        onRecordPayment={setPaymentInvoice}
      />

      <RecordPaymentDialog
        isOpen={!!paymentInvoice}
        onOpenChange={() => setPaymentInvoice(null)}
        invoice={paymentInvoice}
      />

      <DeleteInvoiceDialog
        isOpen={!!invoiceToDelete}
        onOpenChange={() => setInvoiceToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
