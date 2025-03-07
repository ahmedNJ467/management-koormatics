
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, User } from "lucide-react";
import { ContactFormValues } from "./types";
import { Checkbox } from "@/components/ui/checkbox";

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
                value={contact.position || ""}
                onChange={(e) => updateContact(index, { position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={contact.email || ""}
                onChange={(e) => updateContact(index, { email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={contact.phone || ""}
                onChange={(e) => updateContact(index, { phone: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`primary-contact-${index}`}
                  checked={contact.is_primary || false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // If this contact is being checked, uncheck all others
                      contacts.forEach((c, i) => {
                        if (i !== index && c.is_primary) {
                          updateContact(i, { is_primary: false });
                        }
                      });
                    }
                    
                    // Update this contact's primary status
                    updateContact(index, { is_primary: !!checked });
                  }}
                />
                <label 
                  htmlFor={`primary-contact-${index}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Primary Contact
                </label>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
