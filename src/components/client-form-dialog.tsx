
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { ContactFormValues, ClientDocument } from "./client-form/types";
import { X, Upload, Download, User, Trash2 } from "lucide-react";

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
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const {
    form,
    isSubmitting,
    contacts,
    setContacts,
    documents,
    setDocuments,
    profilePreview,
    handleProfileChange,
    handleDocumentUpload,
    handleSubmit,
  } = useClientForm(client);

  const clientType = form.watch("type");

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

  const removeDocument = (docId: string) => {
    setDocuments(documents.filter((doc) => doc.id !== docId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                <User className="h-8 w-4 text-gray-400" />
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
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                defaultValue={form.getValues("type")}
                onValueChange={(value) =>
                  form.setValue("type", value as "organization" | "individual")
                }
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
          ) : (
            // Organization Contacts
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Contact Persons</Label>
                <Button type="button" variant="outline" onClick={addContact}>
                  Add Contact Person
                </Button>
              </div>
              {contacts.map((contact, index) => (
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
                    <Label>Name</Label>
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
                </div>
              ))}
            </div>
          )}

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
              {documents.map((doc) => (
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
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : client ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
