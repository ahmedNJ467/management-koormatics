
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type ContactFormValues } from "./types";

export function useClientContacts(clientId: string | undefined, clientType: string) {
  const [contacts, setContacts] = useState<ContactFormValues[]>([]);

  // Fetch client contacts if this is an organization
  useEffect(() => {
    if (!clientId || clientType !== 'organization') {
      setContacts([]);
      return;
    }

    const fetchContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('client_contacts')
          .select('*')
          .eq('client_id', clientId);

        if (error) throw error;

        if (data && data.length > 0) {
          setContacts(data.map(contact => ({
            id: contact.id,
            name: contact.name,
            position: contact.position || "",
            email: contact.email || "",
            phone: contact.phone || "",
            is_primary: contact.is_primary || false
          })));
        } else {
          setContacts([]);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
      }
    };

    fetchContacts();
  }, [clientId, clientType]);

  return {
    contacts,
    setContacts
  };
}

// Function to save contacts to Supabase
export async function saveClientContacts(
  clientId: string, 
  contacts: ContactFormValues[],
  isUpdate: boolean
) {
  if (isUpdate) {
    // Delete existing contacts
    const { error: deleteContactsError } = await supabase
      .from("client_contacts")
      .delete()
      .eq("client_id", clientId);

    if (deleteContactsError) {
      console.error("Error deleting existing contacts:", deleteContactsError);
      throw deleteContactsError;
    }
  }

  // Insert new contacts if any
  if (contacts.length > 0) {
    const formattedContacts = contacts.map((contact) => ({
      client_id: clientId,
      name: contact.name, // name is required
      position: contact.position || null,
      email: contact.email || null,
      phone: contact.phone || null,
      is_primary: contact.is_primary || false,
    }));

    const { error: contactsError } = await supabase
      .from("client_contacts")
      .insert(formattedContacts);

    if (contactsError) {
      console.error("Error inserting contacts:", contactsError);
      throw contactsError;
    }
  }
}
