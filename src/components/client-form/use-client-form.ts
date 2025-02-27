
import { useState, useEffect } from "react";
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

  // Fetch client contacts if this is an organization
  useEffect(() => {
    if (!client || client.type !== 'organization') return;

    const fetchContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('client_contacts')
          .select('*')
          .eq('client_id', client.id);

        if (error) throw error;

        if (data && data.length > 0) {
          setContacts(data.map(contact => ({
            name: contact.name,
            position: contact.position || "",
            email: contact.email || "",
            phone: contact.phone || "",
            is_primary: contact.is_primary || false
          })));
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, [client]);

  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const objectUrl = URL.createObjectURL(file);
      setProfilePreview(objectUrl);
    }
  };

  const handleDocumentUpload = async (files: FileList) => {
    if (!client?.id) {
      toast({
        title: "Error",
        description: "Please save the client first before uploading documents",
        variant: "destructive",
      });
      return;
    }

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

      if (profileFile) {
        if (client) {
          // Update existing client's profile image
          profileImageUrl = await uploadClientFile(
            profileFile,
            "client-profiles",
            client.id,
            "profile"
          );
        } else {
          // For new clients, we'll upload the profile image after creating the client
          // So we don't do anything with profileFile yet
        }
      }

      const formattedValues = {
        name: values.name, // Ensure name is always included
        type: values.type,
        description: values.description || null,
        website: values.website || null,
        address: values.address || null,
        contact: values.contact || null,
        email: values.email || null,
        phone: values.phone || null,
        profile_image_url: profileImageUrl,
        documents: documents.length > 0 ? documents : null, // Ensure documents field is set
      };

      if (client) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(formattedValues)
          .eq("id", client.id);

        if (updateError) throw updateError;

        // Update contacts if organization
        if (values.type === "organization" && contacts.length > 0) {
          // First delete all existing contacts
          await supabase
            .from("client_contacts")
            .delete()
            .eq("client_id", client.id);

          // Then insert the new contacts
          const formattedContacts = contacts.map((contact) => ({
            client_id: client.id,
            name: contact.name, // name is required
            position: contact.position || null,
            email: contact.email || null,
            phone: contact.phone || null,
            is_primary: contact.is_primary || false,
          }));

          const { error: contactsError } = await supabase
            .from("client_contacts")
            .insert(formattedContacts);

          if (contactsError) throw contactsError;
        }

        toast({
          title: "Client updated",
          description: "The client has been updated successfully.",
        });
      } else {
        // Insert new client
        const { data: insertedClient, error: insertError } = await supabase
          .from("clients")
          .insert({
            ...formattedValues,
            documents: documents.length > 0 ? documents : []
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Now that we have a client ID, upload the profile image if provided
        if (profileFile && insertedClient) {
          const profileImageUrl = await uploadClientFile(
            profileFile,
            "client-profiles",
            insertedClient.id,
            "profile"
          );

          // Update the client with the profile image URL
          if (profileImageUrl) {
            await supabase
              .from("clients")
              .update({ profile_image_url: profileImageUrl })
              .eq("id", insertedClient.id);
          }
        }

        // Add contacts if organization
        if (values.type === "organization" && contacts.length > 0 && insertedClient) {
          // Ensure all contact records have required fields
          const formattedContacts = contacts.map((contact) => ({
            client_id: insertedClient.id,
            name: contact.name, // name is required
            position: contact.position || null,
            email: contact.email || null,
            phone: contact.phone || null,
            is_primary: contact.is_primary || false,
          }));

          const { error: contactsError } = await supabase
            .from("client_contacts")
            .insert(formattedContacts);

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
