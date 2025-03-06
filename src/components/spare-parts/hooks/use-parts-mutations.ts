
import { useAddPartMutation } from "./mutations/use-add-part-mutation";
import { useUpdatePartMutation } from "./mutations/use-update-part-mutation";
import { useDeletePartMutation } from "./mutations/use-delete-part-mutation";
import { getStatusFromQuantity } from "../utils/status-utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePartsMutations = () => {
  const [isStorageAvailable, setIsStorageAvailable] = useState<boolean | null>(null);
  
  // Check if storage is available
  useEffect(() => {
    const checkStorageAvailability = async () => {
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error("Storage availability check failed:", error);
          setIsStorageAvailable(false);
          return;
        }
        
        const hasImagesBucket = buckets?.some(bucket => bucket.id === 'images');
        setIsStorageAvailable(hasImagesBucket);
        
        if (!hasImagesBucket) {
          console.warn("Images bucket not available");
        }
      } catch (error) {
        console.error("Error checking storage:", error);
        setIsStorageAvailable(false);
      }
    };
    
    checkStorageAvailability();
  }, []);
  
  const addPartMutation = useAddPartMutation();
  const updatePartMutation = useUpdatePartMutation();
  const deletePartMutation = useDeletePartMutation();

  return {
    addPartMutation,
    updatePartMutation,
    deletePartMutation,
    getStatusFromQuantity,
    isStorageAvailable
  };
};
