
import { DisplayTrip } from './trip';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_money' | 'cheque' | 'other';

// Define Json type to match Supabase's Json type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
  vat_percentage?: number;
  discount_percentage?: number;
}

export interface DisplayInvoice extends Invoice {
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  trips?: DisplayTrip[];
  quotation_number?: string;
}

// Helper functions for Supabase conversion
export const prepareForSupabase = (items: InvoiceItem[]): Json => {
  return items as unknown as Json;
};

export const convertToInvoice = (supabaseData: any): DisplayInvoice => {
  let parsedItems: InvoiceItem[] = [];
  try {
    if (typeof supabaseData.items === 'string') {
      parsedItems = JSON.parse(supabaseData.items);
    } else if (Array.isArray(supabaseData.items)) {
      parsedItems = supabaseData.items;
    }
  } catch (e) {
    console.error("Error parsing invoice items:", e);
  }

  return {
    ...supabaseData,
    items: parsedItems,
    client_name: supabaseData.clients?.name || "Unknown Client",
    client_email: supabaseData.clients?.email || "",
    client_address: supabaseData.clients?.address || "",
    client_phone: supabaseData.clients?.phone || "",
  };
};
