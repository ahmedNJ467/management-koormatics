
import { useState } from "react";
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

const SpareParts = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  
  const { toast } = useToast();
  const { sortConfig, handleSort } = usePartsSorting();
  const { data: spareParts = [], isLoading } = useSparePartsQuery(sortConfig);
  const { addPartMutation, updatePartMutation, deletePartMutation } = usePartsMutations();
  const { searchQuery, setSearchQuery, filteredParts, inStockParts, lowStockParts, outOfStockParts } = usePartsFilter(spareParts);

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
        onSubmit={(data) => addPartMutation.mutate(data)}
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
          }
        }}
        isDeleting={deletePartMutation.isPending}
        selectedPart={selectedPart}
      />
    </div>
  );
};

export default SpareParts;
