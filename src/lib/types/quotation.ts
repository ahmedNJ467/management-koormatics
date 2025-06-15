
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

export interface QuotationItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Quotation {
  id: string;
  client_id: string;
  date: string;
  valid_until: string;
  status: QuotationStatus;
  items: QuotationItem[];
  total_amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  vat_percentage?: number;
  discount_percentage?: number;
}

export interface DisplayQuotation extends Quotation {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
}
