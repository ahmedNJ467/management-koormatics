
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";
import { logActivity } from "@/utils/activity-logger";

// Function for the AssignDriverDialog component
export const assignDriverToTrip = async (tripId: string, driverId: string) => {
  // Insert into trip_assignments
  const { error: assignmentError } = await supabase.from('trip_assignments').insert({
    trip_id: tripId,
    driver_id: driverId,
    assigned_at: new Date().toISOString(),
    status: "pending", // Using the valid "pending" status value
  });
  
  if (assignmentError) throw assignmentError;
  
  // Update trip with new driver
  const { error: updateError } = await supabase
    .from("trips")
    .update({ driver_id: driverId })
    .eq("id", tripId);
  
  if (updateError) throw updateError;
  
  // Get trip info for better context
  const { data: tripData } = await supabase
    .from("trips")
    .select("pickup_location, dropoff_location")
    .eq("id", tripId)
    .single();
    
  // Log the driver assignment activity with a cleaner title
  // Use the trip ID's first 8 characters as a simple identifier
  const tripIdentifier = tripData?.pickup_location && tripData?.dropoff_location
    ? `${tripData.pickup_location} to ${tripData.dropoff_location}`
    : `Trip-${tripId.slice(0, 8)}`;
  
  await logActivity({
    title: `Driver assigned to ${tripIdentifier}`,
    type: "trip",
    relatedId: tripId
  });
  
  return true;
};

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
    // Use the correct status value
    const { error } = await supabase.from('trip_assignments').insert({
      trip_id: tripToAssign.id,
      driver_id: assignDriver,
      assigned_at: new Date().toISOString(),
      status: "pending", // Using the valid "pending" status value
      notes: assignNote || null
    });
    
    if (error) throw error;
    
    // Update trip with new driver
    const { error: updateError } = await supabase
      .from("trips")
      .update({ driver_id: assignDriver })
      .eq("id", tripToAssign.id);
    
    if (updateError) throw updateError;
    
    // Log the driver assignment activity with cleaner format
    const tripInfo = tripToAssign.pickup_location && tripToAssign.dropoff_location 
      ? `${tripToAssign.pickup_location} to ${tripToAssign.dropoff_location}`
      : `Trip-${tripToAssign.id.slice(0, 8)}`;
    
    await logActivity({
      title: `Driver assigned to ${tripInfo}`,
      type: "driver",
      relatedId: tripToAssign.id
    });
    
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
