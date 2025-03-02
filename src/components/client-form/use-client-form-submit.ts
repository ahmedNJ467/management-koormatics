import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export type ClientDocument = {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
};

export type ClientContact = {
  id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  is_primary?: boolean;
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
};

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

      // Update contacts
      if (contacts.length > 0) {
        // Delete existing contacts for this client
        if (clientId) {
          const { error } = await supabase
            .from('client_contacts')
            .delete()
            .eq('client_id', clientId);
          
          if (error) {
            console.error("Error deleting contacts:", error);
          }
        }
        
        // Insert new contacts
        const contactsWithClientId = contacts.map(contact => ({
          ...contact,
          client_id: clientId,
          id: undefined // Let Supabase generate new IDs
        }));
        
        const { error } = await supabase
          .from('client_contacts')
          .insert(contactsWithClientId);
        
        if (error) {
          console.error("Error inserting contacts:", error);
        }
      }

      // Update members
      if (members.length > 0) {
        // Process member documents if any
        const processedMembers = await Promise.all(
          members.map(async (member) => {
            // Skip document processing if no temp file is present
            if (!member.tempId || !documentFiles[member.tempId]) {
              return {
                ...member,
                client_id: clientId,
                // If updating existing member, keep its ID
                id: member.id || undefined
              };
            }
            
            // Upload document if there is one
            const file = documentFiles[member.tempId];
            const documentName = file.name;
            const documentUrl = await uploadDocumentFn(file, documentName);
            
            return {
              ...member,
              client_id: clientId,
              document_url: documentUrl,
              document_name: documentName,
              tempId: undefined,
              // If updating existing member, keep its ID
              id: member.id || undefined
            };
          })
        );
        
        console.info("Inserting members:", processedMembers);
        
        // If there are any existing members to update
        const existingMembers = processedMembers.filter(m => m.id);
        if (existingMembers.length > 0) {
          for (const member of existingMembers) {
            const memberData = { ...member, id: undefined }; // Remove id for update
            const { error } = await supabase
              .from('client_members')
              .update(memberData)
              .eq('id', member.id);
            
            if (error) {
              console.error("Error updating member:", error, member);
            }
          }
        }
        
        // Insert new members
        const newMembers = processedMembers.filter(m => !m.id).map(m => ({
          ...m,
          id: undefined // Let Supabase generate new IDs
        }));
        
        if (newMembers.length > 0) {
          const { error } = await supabase
            .from('client_members')
            .insert(newMembers);
          
          if (error) {
            console.error("Error inserting members:", error);
          }
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
