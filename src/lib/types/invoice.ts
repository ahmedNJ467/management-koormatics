
import { DisplayTrip } from './trip';

// Define a Json type that matches what Supabase expects
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_money' | 'cheque' | 'other';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  client_id: string;
  date: string;
  due_date: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  total_amount: number;
  paid_amount: number;
  payment_date?: string;
  payment_method?: string;
  quotation_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DisplayInvoice extends Invoice {
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  trips?: DisplayTrip[];
  quotation_number?: string;
}

// Add this additional interface for handling Supabase JSON field
export interface SupabaseInvoice extends Omit<Invoice, 'items'> {
  items: Json; // This allows for the JSON type from Supabase
}

export interface SupabaseDisplayInvoice extends Omit<DisplayInvoice, 'items'> {
  items: Json; // This allows for the JSON type from Supabase
}

// Helper function to convert SupabaseInvoice to Invoice
export const convertToInvoice = (supabaseInvoice: SupabaseInvoice): Invoice => {
  let parsedItems: InvoiceItem[] = [];
  
  try {
    if (typeof supabaseInvoice.items === 'string') {
      parsedItems = JSON.parse(supabaseInvoice.items);
    } else if (Array.isArray(supabaseInvoice.items)) {
      parsedItems = supabaseInvoice.items as unknown as InvoiceItem[];
    } else {
      parsedItems = [];
    }
  } catch (e) {
    console.error("Error parsing invoice items:", e);
    parsedItems = [];
  }
  
  return {
    ...supabaseInvoice,
    items: parsedItems
  };
};

// Helper function to prepare Invoice for Supabase
export const prepareForSupabase = (invoice: Invoice): SupabaseInvoice => {
  return {
    ...invoice,
    items: invoice.items as unknown as Json
  };
};
