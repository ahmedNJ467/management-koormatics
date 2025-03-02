
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { QueryClient } from "@tanstack/react-query";

// Delete trip
export const deleteTrip = async (
  tripToDelete: string | null,
  viewTrip: DisplayTrip | null,
  editTrip: DisplayTrip | null,
  setViewTrip: (trip: DisplayTrip | null) => void,
  setEditTrip: (trip: DisplayTrip | null) => void,
  setDeleteDialogOpen: (open: boolean) => void,
  setTripToDelete: (id: string | null) => void,
  toast: (props: { 
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  queryClient: QueryClient
) => {
  if (!tripToDelete) return;
  
  try {
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", tripToDelete);

    if (error) throw error;

    toast({
      title: "Trip deleted",
      description: "Trip has been deleted successfully",
    });

    queryClient.invalidateQueries({ queryKey: ["trips"] });
    setDeleteDialogOpen(false);
    setTripToDelete(null);
    
    // Close any open dialogs if they were showing the deleted trip
    if (viewTrip && viewTrip.id === tripToDelete) setViewTrip(null);
    if (editTrip && editTrip.id === tripToDelete) setEditTrip(null);
  } catch (error) {
    console.error("Error deleting trip:", error);
    toast({
      title: "Error",
      description: "Failed to delete trip",
      variant: "destructive",
    });
  }
};
