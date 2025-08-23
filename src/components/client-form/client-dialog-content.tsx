
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClientForm } from "./client-form";
import { ClientDocument } from "./types";
import { UseFormReturn } from "react-hook-form";

interface ClientDialogContentProps {
  client: any | null;
  dialogTitle: string;
  form: UseFormReturn<any>;
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
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  handleFormSubmit: (values: any) => Promise<boolean>;
  isArchived?: boolean;
}

export function ClientDialogContent({
  client,
  dialogTitle,
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
  onOpenChange,
  onDelete,
  onRestore,
  onPermanentDelete,
  handleFormSubmit,
  isArchived = false
}: ClientDialogContentProps) {
  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>
          {isArchived 
            ? "View archived client details. You can restore this client or permanently delete it."
            : client 
              ? "Edit client details, contacts, and related information." 
              : "Fill in the details to add a new client."}
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
        removeDocument={removeDocument}
        onCancel={() => onOpenChange(false)}
        onDelete={onDelete}
        onRestore={onRestore}
        onPermanentDelete={onPermanentDelete}
        handleSubmitForm={handleFormSubmit}
        isArchived={isArchived}
      />
    </DialogContent>
  );
}
