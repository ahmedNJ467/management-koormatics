
import { z } from "zod";

export const PartFormSchema = z.object({
  name: z.string().min(1, "Part name is required"),
  part_number: z.string().min(1, "Part number is required"),
  category: z.string().min(1, "Category is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  unit_price: z.number().min(0, "Price cannot be negative"),
  location: z.string().min(1, "Storage location is required"),
  min_stock_level: z.number().min(0, "Minimum stock level cannot be negative"),
  compatibility: z.array(z.string()).optional(),
  part_image: z.instanceof(File).optional(),
  notes: z.string().optional(),
});

export type PartFormValues = z.infer<typeof PartFormSchema>;
