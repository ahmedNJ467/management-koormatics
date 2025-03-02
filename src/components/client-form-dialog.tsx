
import { Dialog } from "@/components/ui/dialog";
import { useClientForm } from "./client-form/use-client-form";
import { ClientDocument } from "./client-form/types";
import { DeleteClientDialog } from "./client-form/delete-client-dialog";
import { useClientDialog } from "./client-form/use-client-dialog";
import { useClientFormSubmit } from "./client-form/use-client-form-submit";
import { useCallback, useMemo } from "react";
import { ClientDialogContent } from "./client-form/client-dialog-content";

interface Client {
  id: string;
  name: string;
  type: "organization" | "individual";
  description?: string;
  website?: string;
  address?: string;
  contact?: string;
  email?: string;
  phone?: string;
  profile_image_url?: string;
  is_archived?: boolean;
  documents?: ClientDocument[];
}

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
      const result = await submitFormFn({
        client,
        values,
        profileUploadFn: uploadProfile,
        documents,
        documentFiles,
        contacts,
        members,
        uploadDocumentFn: uploadClientDocument,
        setIsSubmitting,
        onSuccess: () => {
          onOpenChange(false); // Close the dialog on success
        }
      });
      
      return result;
    } catch (error) {
      console.error("Error submitting form:", error);
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
    submitFormFn,
    onOpenChange
  ]);

  const removeDocument = useCallback((docId: string) => {
    setDocuments(documents.filter((doc) => doc.id !== docId));
  }, [documents, setDocuments]);

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        // Only allow dialog to close if we're not in the middle of confirming a delete
        if (!showDeleteConfirm) {
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
      
      <DeleteClientDialog 
        clientName={client?.name}
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        error={deletionError}
        archiveMode={true}
      />
    </>
  );
}
