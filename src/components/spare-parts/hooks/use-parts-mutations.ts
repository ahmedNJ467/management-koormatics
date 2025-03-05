
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { PartFormSchema } from "../schemas/spare-part-schema";
import { supabase } from "@/integrations/supabase/client";
import { SparePart } from "../types";
import { useToast } from "@/hooks/use-toast";

export const usePartsMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const getStatusFromQuantity = (quantity: number, minStockLevel: number): SparePart['status'] => {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= minStockLevel) return 'low_stock';
    return 'in_stock';
  };

  const addPartMutation = useMutation({
    mutationFn: async (newPart: z.infer<typeof PartFormSchema>) => {
      console.log("Adding new part:", newPart);
      
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
        compatibility: newPart.compatibility || [],
        notes: newPart.notes || ""
      };

      console.log("Inserting part data:", partToInsert);

      const { data, error } = await supabase
        .from("spare_parts")
        .insert(partToInsert)
        .select()
        .single();

      if (error) {
        console.error("Error inserting part:", error);
        throw error;
      }

      console.log("Part inserted successfully:", data);

      if (newPart.part_image && data.id) {
        const fileExt = newPart.part_image.name.split(".").pop();
        const fileName = `${data.id}.${fileExt}`;
        const filePath = `parts/${fileName}`;

        console.log("Uploading image:", filePath);

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, newPart.part_image);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          throw uploadError;
        }

        console.log("Image uploaded successfully");

        const { error: updateError } = await supabase
          .from("spare_parts")
          .update({ part_image: filePath })
          .eq("id", data.id);

        if (updateError) {
          console.error("Error updating part with image path:", updateError);
          throw updateError;
        }
      }

      return data;
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

  const updatePartMutation = useMutation({
    mutationFn: async ({ updatedPart, partId }: { updatedPart: z.infer<typeof PartFormSchema>, partId: string }) => {
      if (!partId) throw new Error("No part selected");

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
        compatibility: updatedPart.compatibility || [],
        notes: updatedPart.notes || ""
      };

      const { data, error } = await supabase
        .from("spare_parts")
        .update(partToUpdate)
        .eq("id", partId)
        .select()
        .single();

      if (error) throw error;

      if (updatedPart.part_image) {
        const fileExt = updatedPart.part_image.name.split(".").pop();
        const fileName = `${partId}.${fileExt}`;
        const filePath = `parts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, updatedPart.part_image, { upsert: true });

        if (uploadError) throw uploadError;

        const { error: updateError } = await supabase
          .from("spare_parts")
          .update({ part_image: filePath })
          .eq("id", partId);

        if (updateError) throw updateError;
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

  const deletePartMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("spare_parts")
        .delete()
        .eq("id", id);

      if (error) throw error;

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

  return {
    addPartMutation,
    updatePartMutation,
    deletePartMutation,
    getStatusFromQuantity
  };
};
