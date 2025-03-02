
import { DisplayTrip, Trip, convertToDisplayTrips } from './trip';

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
