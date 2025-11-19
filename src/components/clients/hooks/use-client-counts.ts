import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContactCounts() {
  return useQuery({
    queryKey: ["client_contacts_count"],
    queryFn: async () => {
      // Use a single query with groupBy to get counts for all clients
      const { data, error } = await supabase
        .from("client_contacts")
        .select("client_id")
        .not("client_id", "is", null);

      if (error) throw error;

      // Count occurrences of each client_id
      const counts: Record<string, number> = {};
      (data || []).forEach((contact: any) => {
        const clientId = contact.client_id;
        counts[clientId] = (counts[clientId] || 0) + 1;
      });

      return counts;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchOnMount: false, // Use cached data first
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData || {}, // Show previous data while fetching
  });
}

export function useMemberCounts() {
  return useQuery({
    queryKey: ["client_members_count"],
    queryFn: async () => {
      try {
        // Check if the table exists first
        try {
          await supabase.from("client_members").select("id").limit(1);
        } catch (error) {
          console.error("Error checking client_members table:", error);
          return {};
        }

        // Use a single query to get all member data
        const { data, error } = await supabase
          .from("client_members")
          .select("client_id")
          .not("client_id", "is", null);

        if (error) {
          console.error("Error fetching member counts:", error);
          return {};
        }

        // Count occurrences of each client_id
        const counts: Record<string, number> = {};
        (data || []).forEach((member: any) => {
          const clientId = member.client_id;
          counts[clientId] = (counts[clientId] || 0) + 1;
        });

        return counts;
      } catch (error) {
        console.error("Error fetching member counts:", error);
        return {};
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes
    refetchOnMount: false, // Use cached data first
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData || {}, // Show previous data while fetching
  });
}
