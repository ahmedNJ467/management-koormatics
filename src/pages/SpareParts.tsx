
import { useState } from "react";
import { Hard_drive, Plus, Edit, Trash2, Search, Package, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SparePart {
  id: string;
  name: string;
  part_number: string;
  category: string;
  manufacturer: string;
  quantity: number;
  unit_price: number;
  location: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  min_stock_level: number;
  created_at: string;
  last_ordered?: string;
  compatibility?: string[];
  part_image?: string;
}

export default function SpareParts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [formData, setFormData] = useState<Partial<SparePart>>({
    name: "",
    part_number: "",
    category: "",
    manufacturer: "",
    quantity: 0,
    unit_price: 0,
    location: "",
    status: "in_stock",
    min_stock_level: 5,
    compatibility: [],
  });
  const [compatibilityInput, setCompatibilityInput] = useState("");
  const [partImage, setPartImage] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch spare parts
  const { data: spareParts = [], isLoading } = useQuery({
    queryKey: ["spareParts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("*")
        .order("created_at", { ascending: false });

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

  // Mutation to add a new spare part
  const addSparePartMutation = useMutation({
    mutationFn: async (newPart: Partial<SparePart>) => {
      const { data, error } = await supabase
        .from("spare_parts")
        .insert([newPart])
        .select()
        .single();

      if (error) throw error;

      // Upload part image if provided
      if (partImage && data.id) {
        const fileExt = partImage.name.split(".").pop();
        const fileName = `${data.id}.${fileExt}`;
        const filePath = `spare_parts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, partImage);

        if (uploadError) throw uploadError;

        // Update part with image path
        const { error: updateError } = await supabase
          .from("spare_parts")
          .update({ part_image: filePath })
          .eq("id", data.id);

        if (updateError) throw updateError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spareParts"] });
      toast({
        title: "Spare part added successfully",
        description: "The new spare part has been added to inventory.",
      });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error adding spare part:", error);
      toast({
        title: "Failed to add spare part",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation to update an existing spare part
  const updateSparePartMutation = useMutation({
    mutationFn: async (updatedPart: Partial<SparePart>) => {
      if (!selectedPart?.id) throw new Error("No part selected");

      const { data, error } = await supabase
        .from("spare_parts")
        .update(updatedPart)
        .eq("id", selectedPart.id)
        .select()
        .single();

      if (error) throw error;

      // Upload new part image if provided
      if (partImage) {
        const fileExt = partImage.name.split(".").pop();
        const fileName = `${selectedPart.id}.${fileExt}`;
        const filePath = `spare_parts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, partImage, { upsert: true });

        if (uploadError) throw uploadError;

        // Update part with image path
        const { error: updateError } = await supabase
          .from("spare_parts")
          .update({ part_image: filePath })
          .eq("id", selectedPart.id);

        if (updateError) throw updateError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spareParts"] });
      toast({
        title: "Spare part updated successfully",
        description: "The spare part details have been updated.",
      });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error updating spare part:", error);
      toast({
        title: "Failed to update spare part",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a spare part
  const deleteSparePartMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("spare_parts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Also delete the image from storage if it exists
      const part = spareParts.find(p => p.id === id);
      if (part?.part_image) {
        const { error: deleteImageError } = await supabase.storage
          .from("images")
          .remove([part.part_image]);

        if (deleteImageError) console.error("Error deleting image:", deleteImageError);
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["spareParts"] });
      toast({
        title: "Spare part deleted",
        description: "The spare part has been removed from inventory.",
      });
    },
    onError: (error) => {
      console.error("Error deleting spare part:", error);
      toast({
        title: "Failed to delete spare part",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      part_number: "",
      category: "",
      manufacturer: "",
      quantity: 0,
      unit_price: 0,
      location: "",
      status: "in_stock",
      min_stock_level: 5,
      compatibility: [],
    });
    setCompatibilityInput("");
    setPartImage(null);
    setSelectedPart(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (name === "quantity" || name === "unit_price" || name === "min_stock_level") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPartImage(e.target.files[0]);
    }
  };

  const addCompatibility = () => {
    if (compatibilityInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        compatibility: [...(prev.compatibility || []), compatibilityInput.trim()],
      }));
      setCompatibilityInput("");
    }
  };

  const removeCompatibility = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      compatibility: (prev.compatibility || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSparePartMutation.mutate({
      ...formData,
      created_at: new Date().toISOString(),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSparePartMutation.mutate(formData);
  };

  const openEditDialog = (part: SparePart) => {
    setSelectedPart(part);
    setFormData({
      name: part.name,
      part_number: part.part_number,
      category: part.category,
      manufacturer: part.manufacturer,
      quantity: part.quantity,
      unit_price: part.unit_price,
      location: part.location,
      status: part.status,
      min_stock_level: part.min_stock_level,
      compatibility: part.compatibility || [],
    });
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (part: SparePart) => {
    if (window.confirm(`Are you sure you want to delete "${part.name}" from inventory?`)) {
      deleteSparePartMutation.mutate(part.id);
    }
  };

  // Filter spare parts based on search query
  const filteredParts = spareParts.filter((part) =>
    part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.part_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    part.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group parts by status
  const inStockParts = filteredParts.filter((p) => p.status === "in_stock");
  const lowStockParts = filteredParts.filter((p) => p.status === "low_stock");
  const outOfStockParts = filteredParts.filter((p) => p.status === "out_of_stock");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Spare Parts Inventory</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Part
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parts by name, number, manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle className="flex items-center text-green-700 dark:text-green-400">
              <Package className="mr-2 h-5 w-5" />
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{inStockParts.length}</div>
            <p className="text-sm text-muted-foreground">Available parts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
            <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-400">
              <Tag className="mr-2 h-5 w-5" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{lowStockParts.length}</div>
            <p className="text-sm text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <Hard_drive className="mr-2 h-5 w-5" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{outOfStockParts.length}</div>
            <p className="text-sm text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parts Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Parts ({filteredParts.length})</TabsTrigger>
              <TabsTrigger value="in_stock">In Stock ({inStockParts.length})</TabsTrigger>
              <TabsTrigger value="low_stock">Low Stock ({lowStockParts.length})</TabsTrigger>
              <TabsTrigger value="out_of_stock">Out of Stock ({outOfStockParts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <SparePartTable
                parts={filteredParts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
              />
            </TabsContent>

            <TabsContent value="in_stock">
              <SparePartTable
                parts={inStockParts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
              />
            </TabsContent>

            <TabsContent value="low_stock">
              <SparePartTable
                parts={lowStockParts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
              />
            </TabsContent>

            <TabsContent value="out_of_stock">
              <SparePartTable
                parts={outOfStockParts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Spare Part Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Spare Part</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Part Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part_number" className="text-right">
                  Part Number
                </Label>
                <Input
                  id="part_number"
                  name="part_number"
                  value={formData.part_number}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="manufacturer" className="text-right">
                  Manufacturer
                </Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit_price" className="text-right">
                  Unit Price ($)
                </Label>
                <Input
                  id="unit_price"
                  name="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Storage Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="min_stock_level" className="text-right">
                  Min Stock Level
                </Label>
                <Input
                  id="min_stock_level"
                  name="min_stock_level"
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="part_image" className="text-right">
                  Upload Image
                </Label>
                <Input
                  id="part_image"
                  name="part_image"
                  type="file"
                  onChange={handleImageChange}
                  className="col-span-3"
                  accept="image/*"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="compatibility" className="text-right">
                  Compatibility
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="compatibility"
                    value={compatibilityInput}
                    onChange={(e) => setCompatibilityInput(e.target.value)}
                    placeholder="Add compatible vehicle model"
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={addCompatibility}>
                    Add
                  </Button>
                </div>
              </div>
              {formData.compatibility && formData.compatibility.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="text-right">Compatible with</div>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {formData.compatibility.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeCompatibility(index)}
                          className="text-secondary hover:text-secondary/80 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addSparePartMutation.isPending}>
                {addSparePartMutation.isPending ? "Saving..." : "Add to Inventory"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Spare Part Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Spare Part</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Part Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-part_number" className="text-right">
                  Part Number
                </Label>
                <Input
                  id="edit-part_number"
                  name="part_number"
                  value={formData.part_number}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Category
                </Label>
                <Input
                  id="edit-category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-manufacturer" className="text-right">
                  Manufacturer
                </Label>
                <Input
                  id="edit-manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="edit-quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unit_price" className="text-right">
                  Unit Price ($)
                </Label>
                <Input
                  id="edit-unit_price"
                  name="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-location" className="text-right">
                  Storage Location
                </Label>
                <Input
                  id="edit-location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <select
                  id="edit-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-min_stock_level" className="text-right">
                  Min Stock Level
                </Label>
                <Input
                  id="edit-min_stock_level"
                  name="min_stock_level"
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-part_image" className="text-right">
                  Upload New Image
                </Label>
                <Input
                  id="edit-part_image"
                  name="part_image"
                  type="file"
                  onChange={handleImageChange}
                  className="col-span-3"
                  accept="image/*"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-compatibility" className="text-right">
                  Compatibility
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="edit-compatibility"
                    value={compatibilityInput}
                    onChange={(e) => setCompatibilityInput(e.target.value)}
                    placeholder="Add compatible vehicle model"
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={addCompatibility}>
                    Add
                  </Button>
                </div>
              </div>
              {formData.compatibility && formData.compatibility.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="text-right">Compatible with</div>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {formData.compatibility.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeCompatibility(index)}
                          className="text-secondary hover:text-secondary/80 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSparePartMutation.isPending}>
                {updateSparePartMutation.isPending ? "Updating..." : "Update Part"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Spare Part Table Component
interface SparePartTableProps {
  parts: SparePart[];
  onEdit: (part: SparePart) => void;
  onDelete: (part: SparePart) => void;
}

const SparePartTable = ({ parts, onEdit, onDelete }: SparePartTableProps) => {
  if (parts.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No spare parts found</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Part Name</TableHead>
            <TableHead>Part Number</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Manufacturer</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id}>
              <TableCell className="font-medium">{part.name}</TableCell>
              <TableCell>{part.part_number}</TableCell>
              <TableCell>{part.category}</TableCell>
              <TableCell>{part.manufacturer}</TableCell>
              <TableCell>{part.quantity}</TableCell>
              <TableCell>${part.unit_price.toFixed(2)}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    part.status === "in_stock"
                      ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                      : part.status === "low_stock"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                      : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                  }`}
                >
                  {part.status === "in_stock"
                    ? "In Stock"
                    : part.status === "low_stock"
                    ? "Low Stock"
                    : "Out of Stock"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(part)}
                    title="Edit part"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(part)}
                    title="Delete part"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
