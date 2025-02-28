
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientForm } from "./client-form/use-client-form";
import { ContactFormValues, ClientDocument, MemberFormValues } from "./client-form/types";
import { X, Upload, Download, User, Trash2, UserPlus, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { MemberDocumentUpload } from "./client-form/member-document-upload";
import { uploadMemberDocument } from "./client-form/use-member-uploads";

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
  const [memberDocumentFiles, setMemberDocumentFiles] = useState<Record<number, File>>({});
  const [memberDocumentUploading, setMemberDocumentUploading] = useState<Record<number, boolean>>({});
  
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
    // Before submitting, handle any pending member document uploads
    if (Object.keys(memberDocumentFiles).length > 0 && client?.id) {
      try {
        // Process document uploads for each member that has a pending file
        for (const indexStr in memberDocumentFiles) {
          const index = parseInt(indexStr);
          const file = memberDocumentFiles[index];
          
          if (!file) continue;
          
          setMemberDocumentUploading(prev => ({ ...prev, [index]: true }));
          
          // Create a temporary id for the member if it doesn't exist
          if (!members[index].id) {
            members[index].id = crypto.randomUUID();
          }
          
          const { url, name } = await uploadMemberDocument(
            file, 
            client.id, 
            members[index].id || `temp-${index}`
          );
          
          // Update the member with the document URL
          const updatedMembers = [...members];
          updatedMembers[index] = {
            ...updatedMembers[index],
            document_url: url,
            document_name: name
          };
          
          setMembers(updatedMembers);
          setMemberDocumentUploading(prev => ({ ...prev, [index]: false }));
        }
        
        // Clear document files after upload
        setMemberDocumentFiles({});
      } catch (error) {
        console.error("Error uploading member documents:", error);
        toast({
          title: "Document Upload Error",
          description: "Failed to upload one or more member documents.",
          variant: "destructive",
        });
      }
    }
    
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

  const updateContact = (index: number, data: Partial<ContactFormValues>) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], ...data };
    setContacts(newContacts);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const addMember = () => {
    setMembers([
      ...members,
      { 
        name: "", 
        role: "", 
        email: "", 
        phone: "", 
        notes: "",
        document_url: "",
        document_name: "" 
      },
    ]);
  };

  const updateMember = (index: number, data: Partial<MemberFormValues>) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], ...data };
    setMembers(newMembers);
  };

  const removeMember = (index: number) => {
    // Also remove any pending document uploads
    if (memberDocumentFiles[index]) {
      const newFiles = { ...memberDocumentFiles };
      delete newFiles[index];
      setMemberDocumentFiles(newFiles);
    }
    
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberDocumentChange = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Store the file for later upload on form submission
    setMemberDocumentFiles(prev => ({
      ...prev,
      [index]: file
    }));
    
    // Update the member with the pending document name
    const updatedMembers = [...members];
    updatedMembers[index] = {
      ...updatedMembers[index],
      document_name: file.name,
    };
    setMembers(updatedMembers);
  };

  const clearMemberDocument = (index: number) => {
    // Remove pending file if exists
    if (memberDocumentFiles[index]) {
      const newFiles = { ...memberDocumentFiles };
      delete newFiles[index];
      setMemberDocumentFiles(newFiles);
    }
    
    // Clear document info from member
    const updatedMembers = [...members];
    updatedMembers[index] = {
      ...updatedMembers[index],
      document_url: "",
      document_name: ""
    };
    setMembers(updatedMembers);
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
              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Profile Image Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileChange}
                      className="hidden"
                      id="profile-upload"
                    />
                    <label
                      htmlFor="profile-upload"
                      className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Profile Image</span>
                    </label>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" {...form.register("name")} />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={form.getValues("type")}
                      onValueChange={(value) => {
                        form.setValue("type", value as "organization" | "individual");
                        // Reset to details tab when changing type
                        setActiveTab("details");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...form.register("description")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" {...form.register("website")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...form.register("address")} />
                  </div>
                </div>

                {clientType === "individual" ? (
                  // Individual Contact Information
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact</Label>
                      <Input id="contact" {...form.register("contact")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" {...form.register("email")} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" {...form.register("phone")} />
                    </div>
                  </div>
                ) : null}

                {/* Document Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Documents</Label>
                    <Input
                      type="file"
                      multiple
                      className="hidden"
                      id="document-upload"
                      onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
                    />
                    <label
                      htmlFor="document-upload"
                      className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Documents</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    {documents.length > 0 ? (
                      documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <span className="text-sm truncate flex-1">{doc.name}</span>
                          <div className="flex items-center space-x-2">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-100 rounded-md"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDocument(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : documentFiles && documentFiles.length > 0 ? (
                      // Display pending uploads for new clients
                      documentFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <div className="flex items-center">
                            <span className="text-xs text-muted-foreground italic mr-2">Pending upload</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No documents uploaded</div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {clientType === "organization" && (
                <>
                  <TabsContent value="contacts" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <Label>Contact Persons</Label>
                      <Button type="button" variant="outline" onClick={addContact}>
                        Add Contact Person
                      </Button>
                    </div>
                    {contacts.length === 0 ? (
                      <div className="text-center py-6 border rounded-md">
                        <User className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No contacts added yet</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={addContact}>
                          Add Contact Person
                        </Button>
                      </div>
                    ) : (
                      contacts.map((contact, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-md relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => removeContact(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                              value={contact.name}
                              onChange={(e) => updateContact(index, { name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Position</Label>
                            <Input
                              value={contact.position}
                              onChange={(e) => updateContact(index, { position: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={contact.email}
                              onChange={(e) => updateContact(index, { email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              value={contact.phone}
                              onChange={(e) => updateContact(index, { phone: e.target.value })}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                checked={contact.is_primary}
                                onChange={(e) => {
                                  // Uncheck all others when this is checked
                                  if (e.target.checked) {
                                    const updatedContacts = contacts.map((c, i) => ({
                                      ...c,
                                      is_primary: i === index
                                    }));
                                    setContacts(updatedContacts);
                                  } else {
                                    updateContact(index, { is_primary: false });
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm font-medium">Primary Contact</span>
                            </label>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                
                  <TabsContent value="members" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <Label>Organization Members</Label>
                      <Button type="button" variant="outline" onClick={addMember}>
                        <UserPlus className="mr-2 h-4 w-4" /> Add Member
                      </Button>
                    </div>
                    
                    {members.length === 0 ? (
                      <div className="text-center py-6 border rounded-md">
                        <UserPlus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No members added yet</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={addMember}>
                          <UserPlus className="mr-2 h-4 w-4" /> Add Member
                        </Button>
                      </div>
                    ) : (
                      members.map((member, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-md relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => removeMember(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                              value={member.name}
                              onChange={(e) => updateMember(index, { name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Input
                              value={member.role}
                              onChange={(e) => updateMember(index, { role: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={member.email}
                              onChange={(e) => updateMember(index, { email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              value={member.phone}
                              onChange={(e) => updateMember(index, { phone: e.target.value })}
                            />
                          </div>
                          
                          {/* Document Upload Field */}
                          <div className="col-span-2 space-y-2">
                            <MemberDocumentUpload
                              documentName={member.document_name || (memberDocumentFiles[index]?.name || null)}
                              documentUrl={member.document_url || null}
                              onDocumentChange={(e) => handleMemberDocumentChange(index, e)}
                              onDocumentClear={() => clearMemberDocument(index)}
                            />
                            {memberDocumentUploading[index] && (
                              <p className="text-xs text-muted-foreground">Uploading document...</p>
                            )}
                          </div>
                          
                          <div className="col-span-2 space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                              value={member.notes}
                              onChange={(e) => updateMember(index, { notes: e.target.value })}
                              rows={3}
                            />
                          </div>
                        </div>
                      ))
                    )}
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
      
      <AlertDialog 
        open={showDeleteConfirm} 
        onOpenChange={(open) => {
          setShowDeleteConfirm(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client {client?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
