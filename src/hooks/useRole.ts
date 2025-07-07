import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRole = () => {
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    // initial fetch
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const metaRoles = (data.session?.user.user_metadata as any)?.koormatics_role || [];
      setRoles(metaRoles);
    };
    load();

    // subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const metaRoles = (session?.user.user_metadata as any)?.koormatics_role || [];
      setRoles(metaRoles);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    roles,
    hasRole: (role: string) => {
      // Allow access in dev if no roles yet assigned
      if (roles.length === 0) return role === "super_admin";
      return roles.includes(role);
    },
  };
}; 