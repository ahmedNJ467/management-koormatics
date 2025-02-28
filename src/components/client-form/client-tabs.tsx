
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientDetails } from "./client-details";
import { ContactsList } from "./contacts-list";
import { MembersTab } from "./members-tab";
import { ClientDocument } from "./types";
import { UseFormReturn } from "react-hook-form";

interface ClientTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  form: UseFormReturn<any>;
  clientType: "organization" | "individual";
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
  isEditing: boolean;
  addContact: () => void;
  updateContact: (index: number, data: Partial<any>) => void;
  removeContact: (index: number) => void;
}

export function ClientTabs({
  activeTab,
  setActiveTab,
  form,
  clientType,
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
  isEditing,
  addContact,
  updateContact,
  removeContact,
}: ClientTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Details</TabsTrigger>
        {clientType === "organization" && (
          <>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </>
        )}
      </TabsList>
      
      <TabsContent value="details">
        <ClientDetails 
          form={form}
          profilePreview={profilePreview}
          handleProfileChange={handleProfileChange}
          documents={documents}
          documentFiles={documentFiles}
          handleDocumentUpload={handleDocumentUpload}
          removeDocument={removeDocument}
          isEditing={isEditing}
        />
      </TabsContent>
      
      {clientType === "organization" && (
        <>
          <TabsContent value="contacts">
            <ContactsList 
              contacts={contacts} 
              addContact={addContact}
              updateContact={updateContact}
              removeContact={removeContact}
            />
          </TabsContent>
        
          <TabsContent value="members">
            <MembersTab 
              members={members}
              setMembers={setMembers}
              clientId={form.getValues().id}
            />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
