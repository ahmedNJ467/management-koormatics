
import { z } from "zod";

export const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  position: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  is_primary: z.boolean().default(false),
});

export const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["organization", "individual"]),
  description: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
export type ClientFormValues = z.infer<typeof clientSchema>;
export type ClientDocument = {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
};
