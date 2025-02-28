
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClientForm } from "./client-form/use-client-form";
import { ClientDocument } from "./client-form/types";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Import our refactored components
import { ClientDetails } from "./client-form/client-details";
import { ContactsList } from "./client-form/contacts-list";
import { MembersTab } from "./client-form/members-tab";
import { DeleteClientDialog } from "./client-form/delete-client-dialog";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
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
  
  const handleDelete = async () => {
    if (!client?.id) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;
      
      setShowDeleteConfirm(false);
      
      if (onClientDeleted) {
        onClientDeleted();
      } else {
        // If no onClientDeleted callback is provided, close the dialog
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: any) => {
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
            
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="details">
                <ClientDetails 
                  form={form}
                  profilePreview={profilePreview}
                  handleProfileChange={handleProfileChange}
                  documents={documents}
                  documentFiles={documentFiles}
                  handleDocumentUpload={handleDocumentUpload}
                  removeDocument={removeDocument}
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
                      clientId={client?.id}
                    />
                  </TabsContent>
                </>
              )}
              
              <div className="flex justify-end space-x-2 pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {client && (
                  <Button 
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : client ? "Update Client" : "Add Client"}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <DeleteClientDialog 
        clientName={client?.name}
        isOpen={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
      />
    </>
  );
}
