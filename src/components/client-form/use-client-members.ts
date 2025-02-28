
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type MemberFormValues } from "./types";

export function useClientMembers(clientId: string | undefined, clientType: string) {
  const [members, setMembers] = useState<MemberFormValues[]>([]);

  // Fetch client members if this is an organization
  useEffect(() => {
    if (!clientId || clientType !== 'organization') {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('client_members')
          .select('*')
          .eq('client_id', clientId);

        if (error) {
          // If the table doesn't exist yet or other error
          console.error('Error fetching members:', error);
          setMembers([]);
          return;
        }

        if (data && data.length > 0) {
          setMembers(data.map(member => ({
            id: member.id,
            name: member.name,
            role: member.role || "",
            email: member.email || "",
            phone: member.phone || "",
            notes: member.notes || "",
            document_url: member.document_url || "",
            document_name: member.document_name || ""
          })));
        } else {
          setMembers([]);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        setMembers([]);
      }
    };

    fetchMembers();
  }, [clientId, clientType]);

  return {
    members,
    setMembers
  };
}

// Function to save members to Supabase
export async function saveClientMembers(
  clientId: string, 
  members: MemberFormValues[],
  isUpdate: boolean
) {
  if (isUpdate) {
    // Delete existing members
    const { error: deleteMembersError } = await supabase
      .from("client_members")
      .delete()
      .eq("client_id", clientId);

    if (deleteMembersError) {
      console.error("Error deleting existing members:", deleteMembersError);
      throw deleteMembersError;
    }
  }

  // Insert the new members if any
  if (members.length > 0) {
    // Make sure each member has an ID for the database
    const formattedMembers = members.map(({ id, ...rest }) => ({
      client_id: clientId,
      name: rest.name,
      role: rest.role || null,
      email: rest.email || null,
      phone: rest.phone || null,
      notes: rest.notes || null,
      document_url: rest.document_url || null,
      document_name: rest.document_name || null
    }));

    console.log("Inserting members:", formattedMembers);
    const { error: membersError } = await supabase
      .from("client_members")
      .insert(formattedMembers);

    if (membersError) {
      console.error('Error updating members:', membersError);
      throw membersError;
    }
  }
}
