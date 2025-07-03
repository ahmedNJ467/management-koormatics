import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VehicleAuthWrapperProps {
  children: React.ReactNode;
}

export function VehicleAuthWrapper({ children }: VehicleAuthWrapperProps) {
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("authenticated");
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    const checkAuth = async () => {
      // For development, we'll just set authenticated status
      // In production, uncomment the code below
      /*
      const { data } = await supabase.auth.getSession();
      setAuthStatus(data.session ? 'authenticated' : 'unauthenticated');
      */
      setAuthStatus("authenticated");
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // For development, we'll just set authenticated status
        // In production, uncomment the code below
        // setAuthStatus(session ? 'authenticated' : 'unauthenticated');
        setAuthStatus("authenticated");
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Only show authentication warning in production */}
      {!isDevelopment && authStatus === "unauthenticated" && (
        <div className="p-4 mb-4 border rounded-md bg-destructive/10 text-destructive">
          <p className="font-medium">Authentication required</p>
          <p className="text-sm">
            You need to be logged in to add or edit vehicles.
          </p>
        </div>
      )}
      {children}
    </>
  );
}
