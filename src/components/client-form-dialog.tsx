
import { Dialog } from "@/components/ui/dialog";
import { useClientForm } from "./client-form/use-client-form";
import { ClientDocument, ClientContact, ClientMember } from "./client-form/types";
import { DeleteClientDialog } from "./client-form/delete-client-dialog";
import { useClientDialog } from "./client-form/use-client-dialog";
import { useClientFormSubmit } from "./client-form/use-client-form-submit";
import { useCallback, useMemo, useEffect } from "react";
import { ClientDialogContent } from "./client-form/client-dialog-content";
import { Client } from "@/lib/types/client"; // Import from lib instead of redeclaring

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onClientDeleted?: () => void;
}

export function ClientFormDialog({ open, onOpenChange, client, onClientDeleted }: ClientFormDialogProps) {
  const {
    showDeleteConfirm,
    setShowDeleteConfirm,
    activeTab,
    setActiveTab,
    deletionError,
    handleDelete,
    handleRestore
  } = useClientDialog(client, onOpenChange, onClientDeleted);
  
  const {
    form,
    isSubmitting,
    setIsSubmitting,
    contacts,
    setContacts,
    members,
    setMembers,
    documents,
    setDocuments,
    documentFiles,
    profilePreview,
    handleProfileChange,
    handleDocumentUpload,
    uploadProfile,
    uploadClientDocument
  } = useClientForm(client);
  
  // Close form after successful submission
  useEffect(() => {
    if (isSubmitting === false && form.formState.isSubmitSuccessful) {
      setTimeout(() => {
        onOpenChange(false);
      }, 500); // Short delay to ensure data is saved
    }
  }, [isSubmitting, form.formState.isSubmitSuccessful, onOpenChange]);

  const { handleSubmit: submitFormFn } = useClientFormSubmit();
  
  // Generate dialog title based on client state
  const dialogTitle = useMemo(() => {
    if (!client) return "Add New Client";
    return client.is_archived 
      ? `Archived Client: ${client.name}`
      : `Edit Client: ${client.name}`;
  }, [client]);
  
  // Memoize the handleFormSubmit function to prevent recreation on each render
  const handleFormSubmit = useCallback(async (values: any) => {
    try {
      setIsSubmitting(true);
      
      // Create adapter functions to match the expected types
      const profileUploadAdapter = async (file: File): Promise<string> => {
        const result = await uploadProfile(file);
        return result || '';
      };
      
      const documentUploadAdapter = async (file: File, name: string): Promise<string> => {
        const result = await uploadClientDocument(file, name);
        return result.url;
      };
      
      // Convert documentFiles to the expected Record format
      const documentFilesRecord: Record<string, File> = {};
      if (Array.isArray(documentFiles)) {
        documentFiles.forEach((file, index) => {
          documentFilesRecord[`file_${index}`] = file;
        });
      }
      
      const result = await submitFormFn({
        client,
        values,
        profileUploadFn: profileUploadAdapter,
        documents,
        documentFiles: documentFilesRecord,
        contacts: contacts as ClientContact[],
        members: members as ClientMember[],
        uploadDocumentFn: documentUploadAdapter,
        setIsSubmitting,
        onSuccess: () => {
          // The form will close automatically due to the useEffect above
        }
      });
      
      return result;
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      return false;
    }
  }, [
    client,
    uploadProfile,
    documents,
    documentFiles,
    contacts,
    members,
    uploadClientDocument,
    setIsSubmitting,
    submitFormFn
  ]);

  const removeDocument = useCallback((docId: string) => {
    setDocuments(documents.filter((doc) => doc.id !== docId));
  }, [documents, setDocuments]);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Only allow dialog to close if we're not in the middle of confirming a delete
      if (!showDeleteConfirm && !isSubmitting) {
        onOpenChange(newOpen);
      }
    }}>
      <ClientDialogContent
        client={client}
        dialogTitle={dialogTitle}
        form={form}
        isSubmitting={isSubmitting}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        contacts={contacts}
        setContacts={setContacts}
        members={members}
        setMembers={setMembers}
        documents={documents}
        documentFiles={documentFiles}
        profilePreview={profilePreview}
        handleProfileChange={handleProfileChange}
        handleDocumentUpload={handleDocumentUpload}
        removeDocument={removeDocument}
        onOpenChange={onOpenChange}
        onDelete={() => {
          setShowDeleteConfirm(true);
        }}
        onRestore={handleRestore}
        handleFormSubmit={handleFormSubmit}
        isArchived={!!client?.is_archived}
      />
    </Dialog>
  );
}
