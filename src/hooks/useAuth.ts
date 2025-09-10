import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { getCachedSession, sessionCache } from "@/lib/session-cache";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session with caching to improve performance
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await getCachedSession(supabase);

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        // Update cache when auth state changes
        sessionCache.setCachedSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Prevent cached session from being returned during logout
      sessionCache.setLoggingOut(true);

      // Sign out immediately to let Supabase clear its own persisted tokens
      await supabase.auth.signOut({ scope: "local" });

      // Clear our in-memory and custom cached session references
      sessionCache.clearCache();

      // Remove only our custom storage key(s); avoid clearing entire storage
      try {
        localStorage.removeItem("supabase.auth.token");
      } catch {}
      try {
        sessionStorage.removeItem("supabase.auth.token");
      } catch {}
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // Always reset the flag
      sessionCache.setLoggingOut(false);
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}
