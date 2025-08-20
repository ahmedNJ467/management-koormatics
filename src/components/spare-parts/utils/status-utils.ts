
import { SparePart } from "../types";

export const getStatusFromQuantity = (quantity: number, minStockLevel: number): SparePart['status'] => {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= minStockLevel) return 'low_stock';
  return 'in_stock';
};
