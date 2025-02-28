
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientFormValues, type ClientDocument } from "./types";
import { useClientContacts } from "./use-client-contacts";
import { useClientMembers } from "./use-client-members";
import { useClientDocuments } from "./use-client-documents";
import { useClientProfile } from "./use-client-profile";
import { useClientSave } from "./use-client-save";

interface Client extends ClientFormValues {
  id: string;
  profile_image_url?: string;
  documents?: ClientDocument[];
}

export function useClientForm(client?: Client | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set default values based on client data or empty form
  const defaultValues = client 
    ? { ...client } 
    : {
        name: "",
        type: "individual" as const,
        description: "",
        website: "",
        address: "",
        contact: "",
        email: "",
        phone: "",
      };

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues,
  });

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      form.reset(client);
      resetProfile(client.profile_image_url || null);
      resetDocuments(client.documents || []);
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
      resetProfile(null);
      resetDocuments([]);
    }
  }, [client]);

  // Get the current client type from the form
  const clientType = form.watch("type");

  // Use our custom hooks for different parts of the form
  const { contacts, setContacts } = useClientContacts(client?.id, clientType);
  const { members, setMembers } = useClientMembers(client?.id, clientType);
  
  const { 
    documents, 
    setDocuments, 
    documentFiles, 
    handleDocumentUpload,
    resetDocuments 
  } = useClientDocuments(client?.documents);
  
  const { 
    profilePreview, 
    handleProfileChange, 
    uploadProfile,
    resetProfile 
  } = useClientProfile(client?.profile_image_url);
  
  const { saveClient } = useClientSave();

  const handleSubmit = async (values: ClientFormValues) => {
    console.log("Submitting client form with values:", values);
    console.log("Current members state:", members);
    setIsSubmitting(true);
    
    try {
      const result = await saveClient(
        client,
        values,
        uploadProfile,
        documents,
        documentFiles,
        contacts,
        members,
        handleDocumentUpload
      );
      
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    contacts,
    setContacts,
    members,
    setMembers,
    documents,
    setDocuments,
    documentFiles: documentFiles,
    profilePreview,
    handleProfileChange,
    handleDocumentUpload,
    handleSubmit,
  };
}
