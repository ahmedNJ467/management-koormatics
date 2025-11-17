
import * as z from "zod";
import { DriverStatus } from "@/lib/types/driver";

export const driverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact: z.string().min(5, "Contact must be at least 5 characters"),
  location: z.string().optional().nullable(),
  license_number: z.string().optional().nullable(),
  license_type: z.string().optional().nullable(),
  license_expiry: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "on_leave"] as const),
  is_vip: z.boolean().default(false),
});

export type DriverFormValues = z.infer<typeof driverSchema>;
