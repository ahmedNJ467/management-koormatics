import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type UserRoleRow = {
  role_slug: string;
};

export const useRole = () => {
  const { data: roles = [] } = useQuery<string[]>({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role_slug")
        .eq("user_id", userId);
      if (error) throw error;

      return (data as UserRoleRow[])
        .map((r) => r.role_slug)
        .filter((r): r is string => Boolean(r));
    },
    staleTime: 60_000,
  });

  const hasRole = useMemo(() => {
    return (role: string) => roles.includes(role);
  }, [roles]);

  return { roles, hasRole };
};
