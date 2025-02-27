
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { clientSchema, type ClientFormValues, type ContactFormValues, type ClientDocument } from "./types";
import { uploadClientFile, uploadClientDocument } from "./use-client-uploads";

interface Client extends ClientFormValues {
  id: string;
  profile_image_url?: string;
  documents?: ClientDocument[];
}

export function useClientForm(client?: Client | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState<ContactFormValues[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>(
    client?.documents || []
  );
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(
    client?.profile_image_url || null
  );

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: client || {
      name: "",
      type: "individual",
      description: "",
      website: "",
      address: "",
      contact: "",
      email: "",
      phone: "",
    },
  });

  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const objectUrl = URL.createObjectURL(file);
      setProfilePreview(objectUrl);
    }
  };

  const handleDocumentUpload = async (files: FileList) => {
    if (!client?.id) return;

    try {
      const newDocs = await Promise.all(
        Array.from(files).map((file) => uploadClientDocument(file, client.id))
      );
      setDocuments((prev) => [...prev, ...newDocs]);
      toast({
        title: "Documents uploaded",
        description: `Successfully uploaded ${files.length} document(s)`,
      });
    } catch (error) {
      console.error("Document upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload one or more documents",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (values: ClientFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      let profileImageUrl = client?.profile_image_url;

      if (profileFile && client?.id) {
        profileImageUrl = await uploadClientFile(
          profileFile,
          "client-profiles",
          client.id,
          "profile"
        );
      }

      const formattedValues = {
        ...values,
        profile_image_url: profileImageUrl,
        documents: documents,
      };

      if (client) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(formattedValues)
          .eq("id", client.id);

        if (updateError) throw updateError;

        // Update contacts if organization
        if (values.type === "organization") {
          const { error: contactsError } = await supabase
            .from("client_contacts")
            .upsert(
              contacts.map((contact) => ({
                ...contact,
                client_id: client.id,
              }))
            );

          if (contactsError) throw contactsError;
        }

        toast({
          title: "Client updated",
          description: "The client has been updated successfully.",
        });
      } else {
        const { data: insertedClient, error: insertError } = await supabase
          .from("clients")
          .insert(formattedValues)
          .select()
          .single();

        if (insertError) throw insertError;

        if (values.type === "organization" && insertedClient) {
          const { error: contactsError } = await supabase
            .from("client_contacts")
            .insert(
              contacts.map((contact) => ({
                ...contact,
                client_id: insertedClient.id,
              }))
            );

          if (contactsError) throw contactsError;
        }

        toast({
          title: "Client created",
          description: "A new client has been created successfully.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['clients'] });
      form.reset();
      setContacts([]);
      setDocuments([]);
      setProfileFile(null);
      setProfilePreview(null);
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
    contacts,
    setContacts,
    documents,
    setDocuments,
    profilePreview,
    handleProfileChange,
    handleDocumentUpload,
    handleSubmit,
  };
}
