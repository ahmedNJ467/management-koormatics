
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { ClientContact, ClientDocument, ClientMember } from "./types";

interface FormSubmitParams {
  client: any;
  values: any;
  profileUploadFn: (file: File) => Promise<string>;
  documents: ClientDocument[];
  documentFiles: Record<string, File>;
  contacts: ClientContact[];
  members: ClientMember[];
  uploadDocumentFn: (file: File, name: string) => Promise<string>;
  setIsSubmitting: (isSubmitting: boolean) => void;
  onSuccess?: () => void;
  silentUpdate?: boolean;
}

export function useClientFormSubmit() {
  const { toast } = useToast();

  const handleSubmit = useCallback(async ({
    client,
    values,
    profileUploadFn,
    documents,
    documentFiles,
    contacts,
    members,
    uploadDocumentFn,
    setIsSubmitting,
    onSuccess,
    silentUpdate = false
  }: FormSubmitParams): Promise<boolean> => {
    try {
      // Upload profile image if changed
      let profileImageUrl = client?.profile_image_url || null;
      
      if (values.profile_image_file) {
        profileImageUrl = await profileUploadFn(values.profile_image_file);
      }

      // Prepare client data
      const clientData = {
        name: values.name,
        type: values.type,
        description: values.description,
        website: values.website,
        address: values.address,
        contact: values.contact,
        email: values.email,
        phone: values.phone,
        profile_image_url: profileImageUrl,
        documents: documents,
        is_archived: client?.is_archived || false
      };

      console.info("Updating client with values:", clientData);
      
      // Insert or update client
      let clientId = client?.id;
      if (clientId) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', clientId);
        
        if (error) throw error;
        
        if (!silentUpdate) {
          toast({
            title: "Client updated",
            description: `${values.name} has been updated successfully.`,
          });
        }
      } else {
        // Create new client
        const { data, error } = await supabase
          .from('clients')
          .insert(clientData)
          .select('id')
          .single();
        
        if (error) throw error;
        
        clientId = data.id;
        toast({
          title: "Client created",
          description: `${values.name} has been created successfully.`,
        });
      }

      // Update contacts for organization clients
      if (values.type === 'organization') {
        console.log("Processing organization contacts:", contacts);
        
        // Delete existing contacts for this client
        if (clientId) {
          const { error } = await supabase
            .from('client_contacts')
            .delete()
            .eq('client_id', clientId);
          
          if (error) {
            console.error("Error deleting contacts:", error);
            throw error;
          }
        }
        
        // Only insert contacts if there are any
        if (contacts && contacts.length > 0) {
          // Insert new contacts
          const contactsWithClientId = contacts.map(contact => ({
            name: contact.name,
            position: contact.position || null,
            email: contact.email || null,
            phone: contact.phone || null,
            is_primary: contact.is_primary || false,
            client_id: clientId
          }));
          
          const { error: insertError } = await supabase
            .from('client_contacts')
            .insert(contactsWithClientId);
          
          if (insertError) {
            console.error("Error inserting contacts:", insertError);
            throw insertError;
          }
          
          console.info("Saved client contacts:", contactsWithClientId.length);
        }
      }

      // Update members
      if (members && members.length > 0) {
        console.log("Processing client members:", members);
        
        // Delete existing members for this client first
        if (clientId) {
          const { error } = await supabase
            .from('client_members')
            .delete()
            .eq('client_id', clientId);
          
          if (error) {
            console.error("Error deleting existing members:", error);
            throw error;
          }
        }
        
        // Process member documents if any
        const processedMembers = await Promise.all(
          members.map(async (member) => {
            // Skip document processing if no temp file is present
            if (!member.tempId || !documentFiles[member.tempId]) {
              return {
                name: member.name,
                role: member.role || null,
                email: member.email || null,
                phone: member.phone || null,
                notes: member.notes || null,
                document_url: member.document_url || null,
                document_name: member.document_name || null,
                client_id: clientId
              };
            }
            
            // Upload document if there is one
            const file = documentFiles[member.tempId];
            const documentName = file.name;
            const documentUrl = await uploadDocumentFn(file, documentName);
            
            return {
              name: member.name,
              role: member.role || null,
              email: member.email || null,
              phone: member.phone || null,
              notes: member.notes || null,
              document_url: documentUrl,
              document_name: documentName,
              client_id: clientId
            };
          })
        );
        
        console.info("Inserting members:", processedMembers);
        
        // Insert all members as new entries
        const { error } = await supabase
          .from('client_members')
          .insert(processedMembers);
        
        if (error) {
          console.error("Error inserting members:", error);
          throw error;
        }
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (error) {
      console.error("Error saving client:", error);
      toast({
        title: "Error",
        description: `Failed to save client: ${(error as any).message}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [toast]);

  return { handleSubmit };
}
