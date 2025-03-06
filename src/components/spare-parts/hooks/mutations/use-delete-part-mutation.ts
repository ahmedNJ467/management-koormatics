
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { deletePartImage } from "../../utils/upload-utils";

export const useDeletePartMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting part with ID:", id);
      
      // Try to get the part image path first to delete the image if it exists
      const { data: part } = await supabase
        .from("spare_parts")
        .select("part_image")
        .eq("id", id)
        .single();
      
      if (part?.part_image) {
        // Try to delete the associated image
        await deletePartImage(part.part_image);
      }
      
      const { error } = await supabase
        .from("spare_parts")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting part:", error);
        throw error;
      }

      console.log("Part deleted successfully");
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["spare_parts"] });
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
