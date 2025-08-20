
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClientRealtime() {
  const queryClient = useQueryClient();

  // Subscribe to real-time changes for clients
  useEffect(() => {
    const channel = supabase
      .channel('clients-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'clients' }, 
        () => {
          // Force refresh the clients data when any changes occur
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Subscribe to real-time changes for client contacts
  useEffect(() => {
    const channel = supabase
      .channel('client-contacts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'client_contacts' }, 
        () => {
          // Force refresh the clients data when any contact changes occur
          queryClient.invalidateQueries({ queryKey: ["client_contacts_count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Subscribe to real-time changes for client members
  useEffect(() => {
    const channel = supabase
      .channel('client-members-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'client_members' }, 
        () => {
          // Force refresh the member counts when any member changes occur
          queryClient.invalidateQueries({ queryKey: ["client_members_count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Subscribe to real-time changes for trips (to update active contracts)
  useEffect(() => {
    const channel = supabase
      .channel('trips-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trips' }, 
        () => {
          // Force refresh the clients data when any trip changes occur
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
