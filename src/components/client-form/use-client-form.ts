
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Client {
  id: string;
  name: string;
  type: "organization" | "individual";
  contact?: string;
  email?: string;
  phone?: string;
}

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(["organization", "individual"]),
  contact: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export function useClientForm(client?: Client | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      name: client.name,
      type: client.type,
      contact: client.contact || "",
      email: client.email || "",
      phone: client.phone || "",
    } : {
      name: "",
      type: "individual",
      contact: "",
      email: "",
      phone: "",
    },
  });

  const handleSubmit = async (values: ClientFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      const formattedValues = {
        name: values.name,
        type: values.type,
        contact: values.contact || null,
        email: values.email || null,
        phone: values.phone || null,
      };

      if (client) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(formattedValues)
          .eq("id", client.id);

        if (updateError) throw updateError;

        toast({
          title: "Client updated",
          description: "The client has been updated successfully.",
        });
      } else {
        const { error: insertError } = await supabase
          .from("clients")
          .insert(formattedValues);

        if (insertError) throw insertError;

        toast({
          title: "Client created",
          description: "A new client has been created successfully.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['clients'] });
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save client",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    handleSubmit,
  };
}
