
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VehicleAuthWrapperProps {
  children: React.ReactNode;
}

export function VehicleAuthWrapper({ children }: VehicleAuthWrapperProps) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('authenticated');
  
  useEffect(() => {
    const checkAuth = async () => {
      // For development, we'll just set authenticated status
      // In production, uncomment the code below
      /*
      const { data } = await supabase.auth.getSession();
      setAuthStatus(data.session ? 'authenticated' : 'unauthenticated');
      */
      setAuthStatus('authenticated');
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // For development, we'll just set authenticated status
      // In production, uncomment the code below
      // setAuthStatus(session ? 'authenticated' : 'unauthenticated');
      setAuthStatus('authenticated');
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* Disable the authentication warning in development */}
      {false && authStatus === 'unauthenticated' && (
        <div className="p-4 mb-4 border rounded-md bg-destructive/10 text-destructive">
          <p className="font-medium">Authentication required</p>
          <p className="text-sm">You need to be logged in to add or edit vehicles.</p>
        </div>
      )}
      {children}
    </>
  );
}
