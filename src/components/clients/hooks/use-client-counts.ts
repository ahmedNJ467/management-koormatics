
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContactCounts() {
  return useQuery({
    queryKey: ['client_contacts_count'],
    queryFn: async () => {
      // First get all client IDs
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id');
      
      if (clientError) throw clientError;
      
      const clientIds = clientData.map(client => client.id);
      
      // For each client, count contacts
      const countsPromises = clientIds.map(async (clientId) => {
        const { count, error } = await supabase
          .from('client_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', clientId);
        
        if (error) throw error;
        
        return { clientId, count: count || 0 };
      });
      
      const countsResults = await Promise.all(countsPromises);
      
      // Convert to record
      const counts: Record<string, number> = {};
      countsResults.forEach(result => {
        counts[result.clientId] = result.count;
      });
      
      return counts;
    },
  });
}

export function useMemberCounts() {
  return useQuery({
    queryKey: ['client_members_count'],
    queryFn: async () => {
      try {
        // Check if the table exists first
        try {
          await supabase.from('client_members').select('id').limit(1);
        } catch (error) {
          console.error("Error checking client_members table:", error);
          return {};
        }

        // First get all client IDs
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id');
        
        if (clientError) throw clientError;
        
        const clientIds = clientData.map(client => client.id);
        
        // For each client, count members
        const countsPromises = clientIds.map(async (clientId) => {
          const { count, error } = await supabase
            .from('client_members')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId);
          
          if (error) {
            console.error("Error counting members for client", clientId, error);
            return { clientId, count: 0 };
          }
          
          return { clientId, count: count || 0 };
        });
        
        const countsResults = await Promise.all(countsPromises);
        
        // Convert to record
        const counts: Record<string, number> = {};
        countsResults.forEach(result => {
          counts[result.clientId] = result.count;
        });
        
        return counts;
      } catch (error) {
        console.error("Error fetching member counts:", error);
        return {};
      }
    },
  });
}
