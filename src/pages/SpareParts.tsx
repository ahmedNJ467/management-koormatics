import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Tag, HardDrive, Plus, Edit, Trash2, Search, AlertTriangle, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PartForm } from "@/components/spare-parts/part-form";
import { PartFormSchema } from "@/components/spare-parts/schemas/spare-part-schema";
import { PartStatusBadge } from "@/components/spare-parts/part-status-badge";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { SparePart } from "@/components/spare-parts/types";
import { exportToCSV } from "@/components/reports/utils/csvExport";

const SpareParts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc' | 'desc'}>({
    column: "updated_at",
    direction: "desc"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: spareParts = [], isLoading, isError } = useQuery({
    queryKey: ["spare_parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("*")
        .order(sortConfig.column, { ascending: sortConfig.direction === 'asc' });

      if (error) {
        console.error("Error fetching spare parts:", error);
        toast({
          title: "Error loading spare parts",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      return data as SparePart[];
    },
  });

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
      setIsAddDialogOpen(false);
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
    mutationFn: async (updatedPart: z.infer<typeof PartFormSchema>) => {
      if (!selectedPart?.id) throw new Error("No part selected");

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
        .eq("id", selectedPart.id)
        .select()
        .single();

      if (error) throw error;

      if (updatedPart.part_image) {
        const fileExt = updatedPart.part_image.name.split(".").pop();
        const fileName = `${selectedPart.id}.${fileExt}`;
        const filePath = `parts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, updatedPart.part_image, { upsert: true });

        if (uploadError) throw uploadError;

        const { error: updateError } = await supabase
          .from("spare_parts")
          .update({ part_image: filePath })
          .eq("id", selectedPart.id);

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
      setIsEditDialogOpen(false);
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

      const part = spareParts.find(p => p.id === id);
      if (part?.part_image) {
        const { error: deleteFileError } = await supabase.storage
          .from("images")
          .remove([part.part_image]);

        if (deleteFileError) console.error("Error deleting file:", deleteFileError);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spare_parts"] });
      toast({
        title: "Part deleted",
        description: "The part has been removed from inventory.",
      });
      setIsDeleteDialogOpen(false);
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

  const openEditDialog = (part: SparePart) => {
    setSelectedPart(part);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (part: SparePart) => {
    setSelectedPart(part);
    setIsDeleteDialogOpen(true);
  };

  const handleSort = (column: string) => {
    setSortConfig(current => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusFromQuantity = (quantity: number, minStockLevel: number): SparePart['status'] => {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= minStockLevel) return 'low_stock';
    return 'in_stock';
  };

  const filteredParts = spareParts.filter((part) =>
    part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.part_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inStockParts = filteredParts.filter((p) => p.status === "in_stock");
  const lowStockParts = filteredParts.filter((p) => p.status === "low_stock");
  const outOfStockParts = filteredParts.filter((p) => p.status === "out_of_stock");

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Spare Parts Inventory</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" /> Add Part
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-green-100 dark:border-green-900/30">
          <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-2">
            <CardTitle className="flex items-center text-green-700 dark:text-green-400">
              <Package className="mr-2 h-5 w-5" />
              In Stock
            </CardTitle>
            <CardDescription className="text-green-600/80 dark:text-green-400/80">
              Ready to use parts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">{inStockParts.length}</div>
            <p className="text-sm text-muted-foreground">Available parts</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-yellow-100 dark:border-yellow-900/30">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20 pb-2">
            <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400">
              <Tag className="mr-2 h-5 w-5" />
              Low Stock
            </CardTitle>
            <CardDescription className="text-yellow-600/80 dark:text-yellow-400/80">
              Below minimum level
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{lowStockParts.length}</div>
            <p className="text-sm text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-red-100 dark:border-red-900/30">
          <CardHeader className="bg-red-50 dark:bg-red-900/20 pb-2">
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Out of Stock
            </CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Unavailable parts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-red-700 dark:text-red-400">{outOfStockParts.length}</div>
            <p className="text-sm text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts by name, number, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-background"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Parts Inventory</CardTitle>
          <CardDescription>
            Manage your spare parts inventory, track stock levels, and maintain part information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 grid grid-cols-4 md:w-auto">
              <TabsTrigger value="all">All ({filteredParts.length})</TabsTrigger>
              <TabsTrigger value="in_stock" className="text-green-600">In Stock ({inStockParts.length})</TabsTrigger>
              <TabsTrigger value="low_stock" className="text-yellow-600">Low Stock ({lowStockParts.length})</TabsTrigger>
              <TabsTrigger value="out_of_stock" className="text-red-600">Out of Stock ({outOfStockParts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <PartsTable
                parts={filteredParts}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                isLoading={isLoading}
                onSort={handleSort}
                sortConfig={sortConfig}
              />
            </TabsContent>

            <TabsContent value="in_stock">
              <PartsTable
                parts={inStockParts}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                isLoading={isLoading}
                onSort={handleSort}
                sortConfig={sortConfig}
              />
            </TabsContent>

            <TabsContent value="low_stock">
              <PartsTable
                parts={lowStockParts}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                isLoading={isLoading}
                onSort={handleSort}
                sortConfig={sortConfig}
              />
            </TabsContent>

            <TabsContent value="out_of_stock">
              <PartsTable
                parts={outOfStockParts}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                isLoading={isLoading}
                onSort={handleSort}
                sortConfig={sortConfig}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add New Part</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new part to your inventory.
            </DialogDescription>
          </DialogHeader>
          
          <PartForm 
            onSubmit={(data) => {
              console.log("Add form submitted with data:", data);
              addPartMutation.mutate(data);
            }}
            onCancel={() => setIsAddDialogOpen(false)}
            isSubmitting={addPartMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Part</DialogTitle>
            <DialogDescription>
              Update the details of this spare part.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <PartForm 
              onSubmit={(data) => {
                console.log("Edit form submitted with data:", data);
                updatePartMutation.mutate(data);
              }}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={updatePartMutation.isPending}
              defaultValues={{
                name: selectedPart.name,
                part_number: selectedPart.part_number,
                category: selectedPart.category,
                manufacturer: selectedPart.manufacturer,
                quantity: selectedPart.quantity,
                unit_price: selectedPart.unit_price,
                location: selectedPart.location,
                min_stock_level: selectedPart.min_stock_level,
                compatibility: selectedPart.compatibility || [],
                notes: selectedPart.notes || ""
              }}
              existingImage={selectedPart.part_image}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the part{" "}
              <span className="font-medium">{selectedPart?.name}</span> from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedPart && deletePartMutation.mutate(selectedPart.id)}
              disabled={deletePartMutation.isPending}
            >
              {deletePartMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface PartsTableProps {
  parts: SparePart[];
  onEdit: (part: SparePart) => void;
  onDelete: (part: SparePart) => void;
  isLoading: boolean;
  onSort: (column: string) => void;
  sortConfig: {column: string, direction: 'asc' | 'desc'};
}

const PartsTable = ({ parts, onEdit, onDelete, isLoading, onSort, sortConfig }: PartsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No parts found</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No spare parts match your current search or filter criteria.
        </p>
      </div>
    );
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUpDown className="h-4 w-4 ml-1 text-primary" /> 
      : <ArrowUpDown className="h-4 w-4 ml-1 text-primary rotate-180" />;
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer w-[250px]"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center">
                Part Name <SortIcon column="name" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('part_number')}
            >
              <div className="flex items-center">
                Part Number <SortIcon column="part_number" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer" 
              onClick={() => onSort('category')}
            >
              <div className="flex items-center">
                Category <SortIcon column="category" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('manufacturer')}
            >
              <div className="flex items-center">
                Manufacturer <SortIcon column="manufacturer" />
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer"
              onClick={() => onSort('quantity')}
            >
              <div className="flex items-center justify-end">
                Stock <SortIcon column="quantity" />
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer"
              onClick={() => onSort('unit_price')}
            >
              <div className="flex items-center justify-end">
                Price <SortIcon column="unit_price" />
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id}>
              <TableCell className="font-medium">{part.name}</TableCell>
              <TableCell className="font-mono text-sm">{part.part_number}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                  {part.category}
                </Badge>
              </TableCell>
              <TableCell>{part.manufacturer}</TableCell>
              <TableCell className="text-right font-semibold">
                {part.quantity}
              </TableCell>
              <TableCell className="text-right">
                ${part.unit_price.toFixed(2)}
              </TableCell>
              <TableCell>
                <PartStatusBadge status={part.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(part)}
                    title="Edit part"
                    className="hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(part)}
                    title="Delete part"
                    className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SpareParts;
