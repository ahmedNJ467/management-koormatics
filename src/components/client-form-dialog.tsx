
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useClientForm } from "./client-form/use-client-form";
import { ClientDocument } from "./client-form/types";
import { DeleteClientDialog } from "./client-form/delete-client-dialog";
import { ClientForm } from "./client-form/client-form";
import { useClientDialog } from "./client-form/use-client-dialog";
import { useClientFormSubmit } from "./client-form/use-client-form-submit";

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

  const { handleSubmit: submitForm } = useClientFormSubmit();
  
  const handleFormSubmit = async (values: any) => {
    try {
      const result = await submitForm({
        client,
        values,
        profileUploadFn: uploadProfile,
        documents,
        documentFiles,
        contacts,
        members,
        uploadDocumentFn: uploadClientDocument,
        setIsSubmitting
      });
      
      return result;
    } catch (error) {
      console.error("Error submitting form:", error);
      return false;
    }
  };

  const dialogTitle = client 
    ? client.is_archived
      ? `Archived Client: ${client.name}`
      : `Edit Client: ${client.name}`
    : "Add New Client";

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        // Only allow dialog to close if we're not in the middle of confirming a delete
        if (!showDeleteConfirm) {
          onOpenChange(newOpen);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {client?.is_archived 
                ? "This client is archived. You can view its details or restore it."
                : "Enter the client's information below. Required fields are marked with an asterisk."}
            </DialogDescription>
          </DialogHeader>
          
          <ClientForm
            client={client}
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
            removeDocument={(docId: string) => {
              setDocuments(documents.filter((doc) => doc.id !== docId));
            }}
            onCancel={() => onOpenChange(false)}
            onDelete={() => {
              setShowDeleteConfirm(true);
            }}
            onRestore={client?.is_archived ? handleRestore : undefined}
            handleSubmitForm={handleFormSubmit}
            isArchived={!!client?.is_archived}
          />
        </DialogContent>
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
