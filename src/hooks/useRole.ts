import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useRole = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) {
        if (isMounted) {
          setRoles([]);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("vw_user_roles")
        .select("roles")
        .eq("user_id", userId)
        .maybeSingle();

      if (isMounted) {
        if (error) {
          setRoles([]);
        } else {
          const dbRoles = (data?.roles as string[]) || [];
          if (dbRoles.length > 0) {
            setRoles(dbRoles);
          } else {
            const meta = (session?.user.user_metadata as any) || {};
            const metaRoles: string[] = Array.isArray(meta?.koormatics_role)
              ? meta.koormatics_role
              : meta?.role
              ? [meta.role]
              : [];
            setRoles(metaRoles);
          }
        }
        setLoading(false);
      }
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const userId = session?.user.id;
        if (!userId) {
          setRoles([]);
          return;
        }
        // Re-fetch roles for the new session user
        supabase
          .from("vw_user_roles")
          .select("roles")
          .eq("user_id", userId)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) {
              setRoles([]);
            } else {
              const dbRoles = (data?.roles as string[]) || [];
              if (dbRoles.length > 0) {
                setRoles(dbRoles);
              } else {
                const meta = (session?.user.user_metadata as any) || {};
                const metaRoles: string[] = Array.isArray(meta?.koormatics_role)
                  ? meta.koormatics_role
                  : meta?.role
                  ? [meta.role]
                  : [];
                setRoles(metaRoles);
              }
            }
          });
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    roles,
    loading,
    hasRole: (role: string) => roles.includes(role),
  };
};
