
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useClientForm } from "./client-form/use-client-form";
import { ClientDocument } from "./client-form/types";
import { DeleteClientDialog } from "./client-form/delete-client-dialog";
import { ClientTabs } from "./client-form/client-tabs";
import { ClientFormFooter } from "./client-form/client-form-footer";
import { useClientDialog } from "./client-form/use-client-dialog";

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
    setDeletionError,
    handleDelete
  } = useClientDialog(client, onOpenChange, onClientDeleted);
  
  const {
    form,
    isSubmitting,
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
    handleSubmit,
  } = useClientForm(client);

  const clientType = form.watch("type");
  
  const onSubmit = async (values: any) => {
    console.log("Form submitted with values:", values);
    console.log("Current members:", members);
    console.log("Current contacts:", contacts);
    
    const success = await handleSubmit(values);
    if (success) {
      onOpenChange(false);
    }
  };

  const addContact = () => {
    setContacts([
      ...contacts,
      { name: "", position: "", email: "", phone: "", is_primary: contacts.length === 0 },
    ]);
  };

  const updateContact = (index: number, data: Partial<typeof contacts[0]>) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], ...data };
    setContacts(newContacts);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const removeDocument = (docId: string) => {
    setDocuments(documents.filter((doc) => doc.id !== docId));
  };

  const dialogTitle = client ? `Edit Client: ${client.name}` : "Add New Client";

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
              Enter the client's information below. Required fields are marked with an asterisk.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ClientTabs 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              form={form}
              clientType={clientType}
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
              isEditing={!!client}
              addContact={addContact}
              updateContact={updateContact}
              removeContact={removeContact}
            />
            
            <ClientFormFooter 
              isSubmitting={isSubmitting}
              onCancel={() => onOpenChange(false)}
              onDelete={() => {
                setDeletionError(null);
                setShowDeleteConfirm(true);
              }}
              isEditing={!!client}
            />
          </form>
        </DialogContent>
      </Dialog>
      
      <DeleteClientDialog 
        clientName={client?.name}
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        error={deletionError}
      />
    </>
  );
}
