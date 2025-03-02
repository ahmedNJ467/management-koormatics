
import { format, parseISO, isBefore } from "date-fns";
import { Invoice, InvoiceStatus, InvoiceItem } from "@/lib/types/invoice";

// Helper functions for formatting
export const formatInvoiceId = (id: string): string => {
  return id.substring(0, 8).toUpperCase();
};

export const formatStatus = (status: InvoiceStatus): string => {
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
  return format(new Date(dateStr), "MMM d, yyyy");
};

export const getStatusColor = (status: InvoiceStatus): string => {
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

// Check if an invoice is overdue
export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  return (
    invoice.status === "sent" &&
    isBefore(parseISO(invoice.due_date), new Date())
  );
};

// Calculate total amount for invoice items
export const calculateTotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
};
