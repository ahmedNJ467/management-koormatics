
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, User } from "lucide-react";
import { ContactFormValues } from "./types";

interface ContactsListProps {
  contacts: ContactFormValues[];
  addContact: () => void;
  updateContact: (index: number, data: Partial<ContactFormValues>) => void;
  removeContact: (index: number) => void;
}

export function ContactsList({ contacts, addContact, updateContact, removeContact }: ContactsListProps) {
  return (
    <div className="space-y-4">
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
                      updateContact(index, { is_primary: true });
                      contacts.forEach((_, i) => {
                        if (i !== index) {
                          updateContact(i, { is_primary: false });
                        }
                      });
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
    </div>
  );
}
