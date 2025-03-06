
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { PartFormSchema } from "../../schemas/spare-part-schema";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  uploadPartImage, 
  checkPartImageColumnExists,
  updatePartWithImagePath 
} from "../../utils/upload-utils";
import { updatePartNotes } from "../../utils/notes-utils";
import { getStatusFromQuantity } from "../../utils/status-utils";

export const useUpdatePartMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updatedPart, partId }: { updatedPart: z.infer<typeof PartFormSchema>, partId: string }) => {
      if (!partId) throw new Error("No part selected");
      
      console.log("Updating part:", updatedPart, "for ID:", partId);

      const partToUpdate = {
        name: updatedPart.name,
        part_number: updatedPart.part_number,
        category: updatedPart.category,
        manufacturer: updatedPart.manufacturer,
        quantity: updatedPart.quantity,
        unit_price: updatedPart.unit_price,
        location: updatedPart.location,
        status: getStatusFromQuantity(updatedPart.quantity, updatedPart.min_stock_level),
        min_stock_level: updatedPart.min_stock_level,
        compatibility: updatedPart.compatibility || []
      };

      console.log("Updating part data:", partToUpdate);

      const { data, error } = await supabase
        .from("spare_parts")
        .update(partToUpdate)
        .eq("id", partId)
        .select()
        .single();

      if (error) {
        console.error("Error updating part:", error);
        throw error;
      }

      // Update part notes if needed
      if (updatedPart.notes !== undefined) {
        await updatePartNotes(partId, updatedPart.notes);
      }

      console.log("Part updated successfully:", data);

      // Handle image upload for update if a new file was selected
      if (updatedPart.part_image instanceof File) {
        // Check if part_image column exists
        const hasPartImageColumn = await checkPartImageColumnExists();
        
        if (!hasPartImageColumn) {
          console.log("part_image column does not exist in the database");
          toast({
            title: "Image upload skipped",
            description: "The part was updated but the database doesn't support image uploads",
            variant: "default",
          });
          return data;
        }
        
        // Upload the image
        const filePath = await uploadPartImage(
          updatedPart.part_image, 
          partId,
          (errorMessage) => {
            toast({
              title: "Image upload failed",
              description: errorMessage,
              variant: "destructive",
            });
          }
        );
        
        if (filePath) {
          // Update the part with the image path
          await updatePartWithImagePath(
            partId, 
            filePath,
            (errorMessage) => {
              toast({
                title: "Image path update failed",
                description: errorMessage,
                variant: "destructive",
              });
            }
          );
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spare_parts"] });
      toast({
        title: "Part updated successfully",
        description: "The part details have been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating part:", error);
      toast({
        title: "Failed to update part",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
};
