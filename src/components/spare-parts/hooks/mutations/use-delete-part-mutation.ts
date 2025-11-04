
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { deletePartImage } from "../../utils/upload-utils";
import { cacheInvalidationManager } from "@/lib/cache-invalidation";

export const useDeletePartMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partId: string) => {
      console.log("Deleting part with ID:", partId);
      
      // Get the part image before deleting
      const { data: partData } = await supabase
        .from("spare_parts")
        .select("part_image")
        .eq("id", partId as any)
        .single();

      // Delete the part
      const { error } = await supabase
        .from("spare_parts")
        .delete()
        .eq("id", partId as any);

      if (error) throw error;

      // Delete the image from storage if it exists
      if (partData && 'part_image' in partData && partData.part_image) {
        await deletePartImage(partData.part_image);
      }

      console.log("Part deleted successfully");
      
      return partId;
    },
    onSuccess: async (id) => {
      // Mark that updates have occurred
      cacheInvalidationManager.markRecentUpdates();
      
      // Remove cached data to force fresh fetch
      queryClient.removeQueries({ queryKey: ["spare_parts"] });
      
      // Invalidate and refetch to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spare_parts"] }),
        queryClient.refetchQueries({ queryKey: ["spare_parts"] }),
      ]);
      
      toast({
        title: "Part deleted",
        description: "The part has been removed from inventory.",
      });
    },
    onError: (error) => {
      console.error("Error deleting part:", error);
      toast({
        title: "Failed to delete part",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
};
