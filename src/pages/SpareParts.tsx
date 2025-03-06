
import { useState, useEffect } from "react";
import { z } from "zod";
import { SparePart } from "@/components/spare-parts/types";
import { PartFormSchema } from "@/components/spare-parts/schemas/spare-part-schema";
import { usePartsFilter } from "@/components/spare-parts/hooks/use-parts-filter";
import { usePartsMutations } from "@/components/spare-parts/hooks/use-parts-mutations";
import { usePartsSorting } from "@/components/spare-parts/hooks/use-parts-sorting";
import { useSparePartsQuery } from "@/components/spare-parts/hooks/use-spare-parts-query";
import { SearchBar } from "@/components/spare-parts/search-bar";
import { HeaderActions } from "@/components/spare-parts/header-actions";
import { StatusCards } from "@/components/spare-parts/summary-cards/status-cards";
import { PartsTabs } from "@/components/spare-parts/parts-tabs/parts-tabs";
import { AddPartDialog } from "@/components/spare-parts/dialogs/add-part-dialog";
import { EditPartDialog } from "@/components/spare-parts/dialogs/edit-part-dialog";
import { DeletePartDialog } from "@/components/spare-parts/dialogs/delete-part-dialog";
import { exportToCSV } from "@/components/reports/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createPartsDirectory } from "@/components/spare-parts/utils/upload-utils";

const SpareParts = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [storageAlert, setStorageAlert] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { sortConfig, handleSort } = usePartsSorting();
  const { data: spareParts = [], isLoading } = useSparePartsQuery(sortConfig);
  const { addPartMutation, updatePartMutation, deletePartMutation, isStorageAvailable } = usePartsMutations();
  const { searchQuery, setSearchQuery, filteredParts, inStockParts, lowStockParts, outOfStockParts } = usePartsFilter(spareParts);

  useEffect(() => {
    const checkStorage = async () => {
      try {
        // First check if the storage service is available
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error("Storage check error:", error);
          setStorageAlert("Image uploads are disabled because the storage service is not available.");
          return;
        }
        
        // Check if the images bucket exists
        const hasImagesBucket = buckets?.some(bucket => bucket.id === 'images');
        if (!hasImagesBucket) {
          console.log("Images bucket not available");
          setStorageAlert("Image uploads are disabled because the 'images' storage bucket is not configured.");
          return;
        }
        
        // Check if the parts directory exists and create it if needed
        try {
          const { data: files, error: dirError } = await supabase.storage
            .from("images")
            .list('parts');
            
          if (dirError) {
            console.error("Error checking parts directory:", dirError);
            // Try to create the parts directory
            const created = await createPartsDirectory();
            if (!created) {
              setStorageAlert("Image uploads are disabled because the 'parts' directory could not be created.");
              return;
            }
          }
          
          // If we get here, everything is properly configured
          console.log("Images bucket and parts directory available");
          setStorageAlert(null);
        } catch (dirCheckError) {
          console.error("Error checking parts directory:", dirCheckError);
          setStorageAlert("Image uploads are disabled because the storage directory could not be accessed.");
        }
      } catch (error) {
        console.error("Storage availability check error:", error);
        setStorageAlert("Image uploads are disabled due to storage service configuration issues.");
      }
    };
    
    checkStorage();
  }, []);

  const openEditDialog = (part: SparePart) => {
    setSelectedPart(part);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (part: SparePart) => {
    setSelectedPart(part);
    setIsDeleteDialogOpen(true);
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(filteredParts, 'spare-parts-inventory');
      toast({
        title: "Export successful",
        description: "The spare parts data has been exported to CSV",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <HeaderActions 
        onAddClick={() => setIsAddDialogOpen(true)} 
        onExportClick={handleExportCSV} 
      />

      {storageAlert && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Storage Service Issue</AlertTitle>
          <AlertDescription>
            {storageAlert}
          </AlertDescription>
        </Alert>
      )}

      <StatusCards 
        inStockParts={inStockParts} 
        lowStockParts={lowStockParts} 
        outOfStockParts={outOfStockParts} 
      />

      <SearchBar 
        searchQuery={searchQuery} 
        onChange={setSearchQuery} 
      />

      <PartsTabs 
        filteredParts={filteredParts}
        inStockParts={inStockParts}
        lowStockParts={lowStockParts}
        outOfStockParts={outOfStockParts}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        isLoading={isLoading}
        onSort={handleSort}
        sortConfig={sortConfig}
      />

      <AddPartDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(data) => {
          addPartMutation.mutate(data);
          setIsAddDialogOpen(false);
        }}
        isSubmitting={addPartMutation.isPending}
      />

      <EditPartDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={(data) => {
          if (selectedPart) {
            updatePartMutation.mutate({ 
              updatedPart: data, 
              partId: selectedPart.id 
            });
            setIsEditDialogOpen(false);
          }
        }}
        isSubmitting={updatePartMutation.isPending}
        selectedPart={selectedPart}
      />

      <DeletePartDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          if (selectedPart) {
            deletePartMutation.mutate(selectedPart.id);
            setIsDeleteDialogOpen(false);
          }
        }}
        isDeleting={deletePartMutation.isPending}
        selectedPart={selectedPart}
      />
    </div>
  );
};

export default SpareParts;
