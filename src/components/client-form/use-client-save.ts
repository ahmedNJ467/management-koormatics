
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { type ClientFormValues, type ClientDocument } from "./types";
import { saveClientContacts } from "./use-client-contacts";
import { saveClientMembers } from "./use-client-members";
import { useToast } from "@/hooks/use-toast";

interface Client extends ClientFormValues {
  id: string;
  profile_image_url?: string;
  documents?: ClientDocument[];
}

export function useClientSave() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateExistingClient = async (
    client: Client,
    values: ClientFormValues,
    profileImageUrl: string | null,
    documents: ClientDocument[],
    contacts: any[],
    members: any[]
  ) => {
    // Convert documents to plain objects for storing in jsonb column
    const documentsForUpdate = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      url: doc.url,
      uploadedAt: doc.uploadedAt
    }));

    // Format values for update
    const formattedValues = {
      name: values.name,
      type: values.type,
      description: values.description || null,
      website: values.website || null,
      address: values.address || null,
      contact: values.contact || null,
      email: values.email || null,
      phone: values.phone || null,
      profile_image_url: profileImageUrl,
      documents: documentsForUpdate
    };

    console.log("Updating client with values:", formattedValues);

    // Update client
    const { error: updateError } = await supabase
      .from("clients")
      .update(formattedValues)
      .eq("id", client.id);

    if (updateError) {
      console.error("Error updating client:", updateError);
      throw updateError;
    }

    // Only update contacts/members if we're dealing with an organization
    if (values.type === "organization") {
      await saveClientContacts(client.id, contacts, true);
      await saveClientMembers(client.id, members, true);
    }

    return true;
  };

  const createNewClient = async (
    values: ClientFormValues,
    profileUploadFn: (clientId: string) => Promise<string | null>,
    documents: ClientDocument[],
    documentFiles: File[],
    contacts: any[],
    members: any[],
    uploadDocumentFn: (files: FileList, clientId: string) => Promise<ClientDocument[]>
  ) => {
    // Insert new client
    const formattedValues = {
      name: values.name,
      type: values.type,
      description: values.description || null,
      website: values.website || null,
      address: values.address || null,
      contact: values.contact || null,
      email: values.email || null,
      phone: values.phone || null,
      profile_image_url: null, // We'll update this after creating the client
      documents: []
    };

    console.log("Creating new client with values:", formattedValues);

    const { data: insertedClient, error: insertError } = await supabase
      .from("clients")
      .insert(formattedValues)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating client:", insertError);
      throw insertError;
    }

    if (!insertedClient) {
      throw new Error("Failed to create client");
    }

    // Now that we have a client ID, upload the profile image if provided
    const uploadedProfileUrl = await profileUploadFn(insertedClient.id);

    if (uploadedProfileUrl) {
      await supabase
        .from("clients")
        .update({ profile_image_url: uploadedProfileUrl })
        .eq("id", insertedClient.id);
    }

    // Upload any documents
    if (documentFiles.length > 0) {
      // Create a FileList-like object from Array
      const filesArray = documentFiles;
      const dataTransfer = new DataTransfer();
      filesArray.forEach(file => dataTransfer.items.add(file));
      const filesList = dataTransfer.files;
      
      const uploadedDocs = await uploadDocumentFn(filesList, insertedClient.id);

      // Convert documents to plain objects for storing
      const documentsForUpdate = uploadedDocs.map(doc => ({
        id: doc.id,
        name: doc.name,
        url: doc.url,
        uploadedAt: doc.uploadedAt
      }));

      await supabase
        .from("clients")
        .update({ documents: documentsForUpdate })
        .eq("id", insertedClient.id);
    }

    // Add contacts if organization
    if (values.type === "organization" && contacts.length > 0) {
      await saveClientContacts(insertedClient.id, contacts, false);
    }

    // Add members if organization
    if (values.type === "organization" && members.length > 0) {
      await saveClientMembers(insertedClient.id, members, false);
    }

    return true;
  };

  // Main save function that coordinates the entire save process
  const saveClient = async (
    client: Client | undefined,
    values: ClientFormValues,
    profileUploadFn: (clientId: string) => Promise<string | null>,
    documents: ClientDocument[],
    documentFiles: File[],
    contacts: any[],
    members: any[],
    uploadDocumentFn: (files: FileList, clientId: string) => Promise<ClientDocument[]>
  ) => {
    try {
      let success;

      if (client) {
        const profileImageUrl = await profileUploadFn(client.id);
        success = await updateExistingClient(
          client, values, profileImageUrl, documents, contacts, members
        );
      } else {
        success = await createNewClient(
          values, profileUploadFn, documents, documentFiles, contacts, members, uploadDocumentFn
        );
      }

      if (success) {
        toast({
          title: client ? "Client updated" : "Client created",
          description: client 
            ? "The client has been updated successfully." 
            : "A new client has been created successfully.",
        });

        queryClient.invalidateQueries({ queryKey: ['clients'] });
        queryClient.invalidateQueries({ queryKey: ['client_contacts_count'] });
        queryClient.invalidateQueries({ queryKey: ['client_members_count'] });
      }

      return success;
    } catch (error) {
      console.error("Error saving client:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save client",
        variant: "destructive",
      });
      return false;
    }
  };

  return { saveClient };
}
