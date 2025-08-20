import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemUser {
  user_id: string;
  email: string;
  full_name?: string;
  created_at: string;
  roles: string[];
}

export const useUsers = () => {
  return useQuery<SystemUser[]>({
    queryKey: ["system_users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_user_roles").select("*");
      if (error) throw error;
      return data as SystemUser[];
    },
  });
}; 