import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePageAccess = () => {
  return useQuery<string[]>({
    queryKey: ["page_access"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) return [];

      const { data, error } = await supabase
        .from("vw_user_pages")
        .select("pages")
        .eq("user_id", uid)
        .maybeSingle();

      if (error) throw error;
      return (data?.pages as string[]) || [];
    },
  });
};
