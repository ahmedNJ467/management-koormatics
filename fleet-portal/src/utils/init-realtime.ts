
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to initialize real-time functionality for the dashboard tables
 */
export const useInitializeRealtime = () => {
  useEffect(() => {
    const initRealtime = async () => {
      try {
        // Configure activities table for real-time
        await supabase.from('activities')
          .select('id')
          .limit(1)
          .then(async () => {
            const channel = supabase.channel('public:activities');
            await channel.subscribe();
            console.log('Subscribed to activities table');
          });
        
        // Configure alerts table for real-time
        await supabase.from('alerts')
          .select('id')
          .limit(1)
          .then(async () => {
            const channel = supabase.channel('public:alerts');
            await channel.subscribe();
            console.log('Subscribed to alerts table');
          });
        
        console.log('Real-time functionality initialized');
      } catch (error) {
        console.error('Failed to initialize real-time:', error);
      }
    };
    
    initRealtime();
    
    return () => {
      // Cleanup subscriptions on unmount if needed
    };
  }, []);
};
