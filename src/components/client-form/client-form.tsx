
import { useForm } from "react-hook-form";
import { ClientTabs } from "./client-tabs";
import { ClientFormFooter } from "./client-form-footer";
import { ClientDocument } from "./types";
import { useClientFormSubmit } from "./use-client-form-submit";

interface ClientFormProps {
  client: any | null;
  form: ReturnType<typeof useForm>;
  isSubmitting: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  contacts: any[];
  setContacts: (contacts: any[]) => void;
  members: any[];
  setMembers: (members: any[]) => void;
  documents: ClientDocument[];
  documentFiles: File[];
  profilePreview: string | null;
  handleProfileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDocumentUpload: (files: FileList) => void;
  removeDocument: (docId: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  handleSubmitForm: (values: any) => Promise<boolean>;
  isArchived?: boolean;
}

export function ClientForm({
  client,
  form,
  isSubmitting,
  activeTab,
  setActiveTab,
  contacts,
  setContacts,
  members,
  setMembers,
  documents,
  documentFiles,
  profilePreview,
  handleProfileChange,
  handleDocumentUpload,
  removeDocument,
  onCancel,
  onDelete,
  onRestore,
  handleSubmitForm,
  isArchived = false
}: ClientFormProps) {
  const clientType = form.watch("type");
  
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

  return (
    <form onSubmit={form.handleSubmit(handleSubmitForm)}>
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
        isArchived={isArchived}
      />
      
      <ClientFormFooter 
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        onDelete={onDelete}
        onRestore={onRestore}
        isEditing={!!client}
        isArchived={isArchived}
      />
    </form>
  );
}
