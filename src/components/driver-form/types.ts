
import * as z from "zod";
import type { DriverStatus } from "@/lib/types";

export const driverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact: z.string().min(5, "Contact must be at least 5 characters"),
  license_number: z.string().min(3, "License number is required"),
  license_type: z.string().min(1, "License type is required"),
  license_expiry: z.string().min(1, "License expiry is required"),
  status: z.enum(["active", "inactive", "on_leave"] as const),
});

export type DriverFormValues = z.infer<typeof driverSchema>;
