
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
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
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

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      form.reset(client);
      setProfilePreview(client.profile_image_url || null);
      setDocuments(client.documents || []);
    } else {
      form.reset({
        name: "",
        type: "individual",
        description: "",
        website: "",
        address: "",
        contact: "",
        email: "",
        phone: "",
      });
      setProfilePreview(null);
      setDocuments([]);
    }
  }, [client, form]);

  // Fetch client contacts if this is an organization
  useEffect(() => {
    if (!client || client.type !== 'organization') {
      setContacts([]);
      return;
    }

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
        } else {
          setContacts([]);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
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
    // For new clients, just store the files temporarily
    if (!client?.id) {
      setDocumentFiles(prev => [...prev, ...Array.from(files)]);
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
      };

      if (client) {
        // Update existing client
        if (profileFile) {
          // Update existing client's profile image
          profileImageUrl = await uploadClientFile(
            profileFile,
            "client-profiles",
            client.id,
            "profile"
          );
          formattedValues.profile_image_url = profileImageUrl;
        }

        // Convert documents to JSON format acceptable for supabase
        const documentsJson = documents.length > 0 
          ? documents.map(doc => ({
              id: doc.id,
              name: doc.name,
              url: doc.url,
              uploadedAt: doc.uploadedAt
            }))
          : [];

        const { error: updateError } = await supabase
          .from("clients")
          .update({
            ...formattedValues,
            documents: documentsJson
          })
          .eq("id", client.id);

        if (updateError) throw updateError;

        // Update contacts if organization
        if (values.type === "organization") {
          // First delete all existing contacts
          await supabase
            .from("client_contacts")
            .delete()
            .eq("client_id", client.id);

          // Then insert the new contacts if any
          if (contacts.length > 0) {
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
        }

        toast({
          title: "Client updated",
          description: "The client has been updated successfully.",
        });
        
        return; // Successfully updated, return true
      } else {
        // Insert new client
        const { data: insertedClient, error: insertError } = await supabase
          .from("clients")
          .insert({
            ...formattedValues,
            documents: [] // Empty array for documents, we'll add them later
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (!insertedClient) {
          throw new Error("Failed to create client");
        }

        // Now that we have a client ID, upload the profile image if provided
        if (profileFile) {
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

        // Upload any documents
        if (documentFiles.length > 0) {
          const uploadedDocs = await Promise.all(
            documentFiles.map(file => uploadClientDocument(file, insertedClient.id))
          );

          // Convert documents to a format that can be stored in the database
          const documentsJson = uploadedDocs.map(doc => ({
            id: doc.id,
            name: doc.name,
            url: doc.url,
            uploadedAt: doc.uploadedAt
          }));

          // Update client with documents
          await supabase
            .from("clients")
            .update({ documents: documentsJson })
            .eq("id", insertedClient.id);
        }

        // Add contacts if organization
        if (values.type === "organization" && contacts.length > 0) {
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
        
        return; // Successfully created, return true
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save client",
        variant: "destructive",
      });
      return; // Error occurred, return false
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
    documentFiles,
    profilePreview,
    handleProfileChange,
    handleDocumentUpload,
    handleSubmit,
  };
}
