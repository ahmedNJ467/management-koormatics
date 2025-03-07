
import { useAddPartMutation } from "./mutations/use-add-part-mutation";
import { useUpdatePartMutation } from "./mutations/use-update-part-mutation";
import { useDeletePartMutation } from "./mutations/use-delete-part-mutation";
import { getStatusFromQuantity } from "../utils/status-utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createPartsDirectory } from "../utils/upload-utils";

export const usePartsMutations = () => {
  const [isStorageAvailable, setIsStorageAvailable] = useState<boolean | null>(null);
  
  // Check if storage is available
  useEffect(() => {
    const checkStorageAvailability = async () => {
      try {
        // Check if buckets are accessible
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error("Storage availability check failed:", error);
          setIsStorageAvailable(false);
          return;
        }
        
        // Check if images bucket exists
        const imagesBucket = buckets?.find(bucket => bucket.id === 'images');
        
        if (!imagesBucket) {
          console.warn("Images bucket not available");
          setIsStorageAvailable(false);
          return;
        }
        
        try {
          // Ensure the parts directory exists
          const dirCreated = await createPartsDirectory();
          if (!dirCreated) {
            console.error("Failed to create or verify parts directory");
            setIsStorageAvailable(false);
            return;
          }
          
          // If we reach here, storage is fully configured
          setIsStorageAvailable(true);
        } catch (innerError) {
          console.error("Error creating parts directory:", innerError);
          setIsStorageAvailable(false);
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
