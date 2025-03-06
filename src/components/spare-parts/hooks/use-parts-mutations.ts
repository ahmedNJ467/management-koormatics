
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
        const hasImagesBucket = buckets?.some(bucket => bucket.id === 'images');
        
        if (!hasImagesBucket) {
          console.warn("Images bucket not available");
          setIsStorageAvailable(false);
          return;
        }
        
        // Check if parts directory exists
        try {
          const { data: files, error: dirError } = await supabase.storage
            .from("images")
            .list('parts');
            
          if (dirError || !files || files.length === 0) {
            console.log("Creating parts directory");
            const created = await createPartsDirectory();
            if (!created) {
              setIsStorageAvailable(false);
              return;
            }
          }
        } catch (dirError) {
          console.error("Error checking parts directory:", dirError);
          const created = await createPartsDirectory();
          if (!created) {
            setIsStorageAvailable(false);
            return;
          }
        }
        
        // If we reach here, storage is fully configured
        setIsStorageAvailable(true);
        
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
