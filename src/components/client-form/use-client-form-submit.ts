
import { useCallback } from "react";
import { ClientDocument } from "./types";
import { useClientSave } from "./use-client-save";

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
}

export function useClientFormSubmit() {
  const { saveClient } = useClientSave();

  const handleSubmit = useCallback(async ({
    client,
    values,
    profileUploadFn,
    documents,
    documentFiles,
    contacts,
    members,
    uploadDocumentFn,
    setIsSubmitting
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
      return result;
    } catch (error) {
      console.error("Error submitting form:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [saveClient]);

  return { handleSubmit };
}
