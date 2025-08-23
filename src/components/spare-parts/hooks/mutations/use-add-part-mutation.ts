
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { PartFormSchema } from "../../schemas/spare-part-schema";
import { supabase } from "@/integrations/supabase/client";
import { SparePart } from "../../types";
import { useToast } from "@/hooks/use-toast";
import { 
  uploadPartImage, 
  checkPartImageColumnExists,
  updatePartWithImagePath 
} from "../../utils/upload-utils";
import { updatePartNotes } from "../../utils/notes-utils";
import { getStatusFromQuantity } from "../../utils/status-utils";

export const useAddPartMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPart: z.infer<typeof PartFormSchema>) => {
      console.log("Adding new part:", newPart);
      
      // Create the object that matches the database schema exactly
      const partToInsert = {
        name: newPart.name,
        part_number: newPart.part_number,
        category: newPart.category,
        manufacturer: newPart.manufacturer,
        quantity: newPart.quantity,
        unit_price: newPart.unit_price,
        location: newPart.location,
        status: getStatusFromQuantity(newPart.quantity, newPart.min_stock_level),
        min_stock_level: newPart.min_stock_level,
        compatibility: newPart.compatibility || []
      };

      console.log("Inserting part data:", partToInsert);

      // First insert the part
      const { data: insertedPart, error: insertError } = await supabase
        .from("spare_parts")
        .insert(partToInsert)
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting part:", insertError);
        throw insertError;
      }

      // Update part notes if provided
      if (newPart.notes) {
        await updatePartNotes(insertedPart.id, newPart.notes);
      }

      // Handle image upload if provided
      if (newPart.part_image instanceof File) {
        // Check if part_image column exists
        const hasPartImageColumn = await checkPartImageColumnExists();
        
        if (!hasPartImageColumn) {
          console.log("part_image column does not exist in the database");
          toast({
            title: "Image upload skipped",
            description: "The part was saved but the database doesn't support image uploads",
            variant: "default",
          });
          return insertedPart;
        }
        
        // Upload the image
        const filePath = await uploadPartImage(
          newPart.part_image, 
          insertedPart.id,
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
            insertedPart.id, 
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

      return insertedPart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spare_parts"] });
      toast({
        title: "Part added successfully",
        description: "The new part has been added to inventory.",
      });
    },
    onError: (error) => {
      console.error("Error adding part:", error);
      toast({
        title: "Failed to add part",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
};
