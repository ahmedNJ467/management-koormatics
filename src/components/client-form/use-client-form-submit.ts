
import { useCallback } from "react";
import { ClientDocument } from "./types";
import { useClientSave } from "./use-client-save";
import { useToast } from "@/hooks/use-toast";

interface FormSubmitOptions {
  client: any | undefined;
  values: any;
  profileUploadFn: (clientId: string) => Promise<string | null>;
  documents: ClientDocument[];
  documentFiles: File[];
  contacts: any[];
  members: any[];
  uploadDocumentFn: (files: FileList, clientId: string) => Promise<ClientDocument[]>;
  setIsSubmitting: (value: boolean) => void;
  onSuccess?: () => void;
}

export function useClientFormSubmit() {
  const { saveClient } = useClientSave();
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
    onSuccess
  }: FormSubmitOptions) => {
    try {
      setIsSubmitting(true);
      const result = await saveClient(
        client,
        values,
        profileUploadFn,
        documents,
        documentFiles,
        contacts,
        members,
        uploadDocumentFn
      );
      
      if (result && onSuccess) {
        onSuccess();
      }
      
      return result;
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to save client. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [saveClient, toast]);

  return { handleSubmit };
}
