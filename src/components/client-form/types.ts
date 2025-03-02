
import { z } from "zod";

export const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  position: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  is_primary: z.boolean().default(false),
});

export const memberSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  document_url: z.string().optional(),
  document_name: z.string().optional(),
  tempId: z.string().optional(), // Added for temporary IDs during file upload
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
export type MemberFormValues = z.infer<typeof memberSchema>;
export type ClientFormValues = z.infer<typeof clientSchema>;
export type ClientDocument = {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
};

// Add explicit ClientContact and ClientMember types matching the shapes used in code
export type ClientContact = {
  id?: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
  client_id?: string;
};

export type ClientMember = {
  id?: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  notes?: string;
  document_url?: string;
  document_name?: string;
  tempId?: string;
  client_id?: string;
};
