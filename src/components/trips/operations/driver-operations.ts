
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";

// Handle assigning a driver
export const handleAssignDriver = async (
  tripToAssign: DisplayTrip | null,
  assignDriver: string,
  assignNote: string,
  setAssignOpen: (open: boolean) => void,
  setTripToAssign: (trip: DisplayTrip | null) => void,
  setAssignDriver: (id: string) => void,
  setAssignNote: (note: string) => void,
  toast: (props: { 
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  queryClient: QueryClient
) => {
  if (!tripToAssign || !assignDriver) return;
  
  try {
    // Skip the RPC and use direct insertion
    const { error } = await supabase.from('trip_assignments').insert({
      trip_id: tripToAssign.id,
      driver_id: assignDriver,
      assigned_at: new Date().toISOString(),
      status: "pending",
      notes: assignNote || null
    });
    
    if (error) throw error;
    
    // Update trip with new driver
    const { error: updateError } = await supabase
      .from("trips")
      .update({ driver_id: assignDriver })
      .eq("id", tripToAssign.id);
    
    if (updateError) throw updateError;
    
    toast({
      title: "Driver assigned",
      description: "Driver has been assigned to the trip",
    });
    
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["tripAssignments", tripToAssign.id] });
    
    setAssignOpen(false);
    setTripToAssign(null);
    setAssignDriver("");
    setAssignNote("");
  } catch (error) {
    console.error("Error assigning driver:", error);
    toast({
      title: "Error",
      description: "Failed to assign driver",
      variant: "destructive",
    });
  }
};
