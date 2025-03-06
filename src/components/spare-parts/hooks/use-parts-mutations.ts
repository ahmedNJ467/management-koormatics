
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

      // Try to update with notes separately if it exists in the form data
      if (newPart.notes) {
        try {
          // Use our custom RPC function to update the notes field if it exists
          const { error: notesError } = await supabase
            .rpc('update_part_notes' as any, { 
              part_id: insertedPart.id, 
              notes_value: newPart.notes 
            } as any);
            
          if (notesError) {
            console.log("Could not update notes:", notesError);
          }
        } catch (error) {
          console.log("Failed to update notes, field may not exist:", error);
        }
      }

      // Only try to upload and update part_image if we have an actual File object
      if (newPart.part_image instanceof File) {
        try {
          // First check if the part_image column exists
          const { data: columnCheck } = await supabase
            .from('spare_parts')
            .select('part_image')
            .limit(1);
          
          const hasPartImageColumn = columnCheck && 
                                     columnCheck.length > 0 && 
                                     'part_image' in columnCheck[0];
          
          if (!hasPartImageColumn) {
            console.log("part_image column does not exist in the database");
            toast({
              title: "Image upload skipped",
              description: "The part was saved but the database doesn't support image uploads",
              variant: "default",
            });
            return insertedPart;
          }
          
          // If column exists, proceed with upload
          const fileExt = newPart.part_image.name.split(".").pop();
          const fileName = `${insertedPart.id}.${fileExt}`;
          const filePath = `parts/${fileName}`;

          // Check if the storage bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const imagesBucketExists = buckets?.some(bucket => bucket.name === 'images');
          
          if (!imagesBucketExists) {
            console.error("The 'images' storage bucket does not exist");
            toast({
              title: "Image upload failed",
              description: "The storage bucket doesn't exist. Please contact your administrator.",
              variant: "destructive",
            });
            return insertedPart;
          }

          const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(filePath, newPart.part_image, {
              cacheControl: "3600",
              upsert: true
            });

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            toast({
              title: "Image upload failed",
              description: "The part was saved but we couldn't upload the image: " + uploadError.message,
              variant: "destructive",
            });
            return insertedPart;
          }

          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from("images")
            .getPublicUrl(filePath);

          // Update the part with the image path
          const { error: updateError } = await supabase
            .from("spare_parts")
            .update({ part_image: filePath })
            .eq("id", insertedPart.id);

          if (updateError) {
            console.error("Error updating part with image path:", updateError);
            toast({
              title: "Image path update failed",
              description: "The part and image were saved but the link wasn't updated",
              variant: "destructive",
            });
          }
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          toast({
            title: "Image upload failed",
            description: "The part was saved but we couldn't upload the image",
            variant: "destructive",
          });
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

  const updatePartMutation = useMutation({
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

      // Try to update notes separately
      if (updatedPart.notes !== undefined) {
        try {
          // Use our custom RPC function to update the notes field if it exists
          const { error: notesError } = await supabase
            .rpc('update_part_notes' as any, { 
              part_id: partId, 
              notes_value: updatedPart.notes 
            } as any);
            
          if (notesError) {
            console.log("Could not update notes:", notesError);
          }
        } catch (error) {
          console.log("Failed to update notes, field may not exist:", error);
        }
      }

      console.log("Part updated successfully:", data);

      // Handle image upload for update if a new file was selected
      if (updatedPart.part_image instanceof File) {
        try {
          // First check if the part_image column exists
          const { data: columnCheck } = await supabase
            .from('spare_parts')
            .select('part_image')
            .limit(1);
          
          const hasPartImageColumn = columnCheck && 
                                     columnCheck.length > 0 && 
                                     'part_image' in columnCheck[0];
          
          if (!hasPartImageColumn) {
            console.log("part_image column does not exist in the database");
            toast({
              title: "Image upload skipped",
              description: "The part was updated but the database doesn't support image uploads",
              variant: "default",
            });
            return data;
          }
          
          // Check if the storage bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const imagesBucketExists = buckets?.some(bucket => bucket.name === 'images');
          
          if (!imagesBucketExists) {
            console.error("The 'images' storage bucket does not exist");
            toast({
              title: "Image upload failed",
              description: "The storage bucket doesn't exist. Please contact your administrator.",
              variant: "destructive",
            });
            return data;
          }
          
          // If column exists, proceed with upload
          const fileExt = updatedPart.part_image.name.split(".").pop();
          const fileName = `${partId}.${fileExt}`;
          const filePath = `parts/${fileName}`;

          console.log("Uploading image:", filePath);

          const { error: uploadError } = await supabase.storage
            .from("images")
            .upload(filePath, updatedPart.part_image, { upsert: true });

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            toast({
              title: "Image upload failed",
              description: "The part was updated but we couldn't upload the image: " + uploadError.message,
              variant: "destructive",
            });
            return data;
          }

          console.log("Image uploaded successfully");

          const { error: updateError } = await supabase
            .from("spare_parts")
            .update({ part_image: filePath })
            .eq("id", partId);

          if (updateError) {
            console.error("Error updating part with image path:", updateError);
            toast({
              title: "Image path update failed",
              description: "The part was updated but we couldn't update the image path",
              variant: "destructive",
            });
          }
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          // We don't want to fail the entire operation if just the image upload fails
          toast({
            title: "Image upload failed",
            description: "The part was updated but we couldn't upload the image",
            variant: "destructive",
          });
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

  const deletePartMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting part with ID:", id);
      
      // Try to get the part image path first to delete the image if it exists
      const { data: part } = await supabase
        .from("spare_parts")
        .select("part_image")
        .eq("id", id)
        .single();
      
      if (part?.part_image) {
        try {
          // Try to delete the associated image
          const { error: deleteImageError } = await supabase.storage
            .from("images")
            .remove([part.part_image]);
          
          if (deleteImageError) {
            console.error("Error deleting image:", deleteImageError);
            // Continue with part deletion even if image deletion fails
          }
        } catch (error) {
          console.error("Failed to delete image:", error);
          // Continue with part deletion even if image deletion fails
        }
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

  return {
    addPartMutation,
    updatePartMutation,
    deletePartMutation,
    getStatusFromQuantity
  };
};
