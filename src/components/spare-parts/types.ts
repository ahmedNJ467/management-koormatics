
export interface SparePart {
  id: string;
  name: string;
  part_number: string;
  category: string;
  manufacturer: string;
  quantity: number;
  unit_price: number;
  location: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  min_stock_level: number;
  compatibility?: string[];
  part_image?: string;
  last_ordered?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
