
import { useState } from "react";
import { FileText, Plus, Edit, Trash2, Download } from "lucide-react";
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

export interface Contract {
  id: string;
  name: string;
  client_name: string;
  status: "active" | "expired" | "pending";
  start_date: string;
  end_date: string;
  created_at: string;
  contract_file?: string;
}

export default function Contracts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState<Partial<Contract>>({
    name: "",
    client_name: "",
    status: "pending",
    start_date: "",
    end_date: "",
  });
  const [contractFile, setContractFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contracts:", error);
        toast({
          title: "Error loading contracts",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      return data as Contract[];
    },
  });

  // Mutation to add a new contract
  const addContractMutation = useMutation({
    mutationFn: async (newContract: Partial<Contract>) => {
      const { data, error } = await supabase
        .from("contracts")
        .insert(newContract)
        .select()
        .single();

      if (error) throw error;

      // Upload contract file if provided
      if (contractFile && data.id) {
        const fileExt = contractFile.name.split(".").pop();
        const fileName = `${data.id}.${fileExt}`;
        const filePath = `contracts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, contractFile);

        if (uploadError) throw uploadError;

        // Update contract with file path
        const { error: updateError } = await supabase
          .from("contracts")
          .update({ contract_file: filePath })
          .eq("id", data.id);

        if (updateError) throw updateError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: "Contract added successfully",
        description: "The new contract has been added to the system.",
      });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error adding contract:", error);
      toast({
        title: "Failed to add contract",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation to update an existing contract
  const updateContractMutation = useMutation({
    mutationFn: async (updatedContract: Partial<Contract>) => {
      if (!selectedContract?.id) throw new Error("No contract selected");

      const { data, error } = await supabase
        .from("contracts")
        .update(updatedContract)
        .eq("id", selectedContract.id)
        .select()
        .single();

      if (error) throw error;

      // Upload new contract file if provided
      if (contractFile) {
        const fileExt = contractFile.name.split(".").pop();
        const fileName = `${selectedContract.id}.${fileExt}`;
        const filePath = `contracts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, contractFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Update contract with file path
        const { error: updateError } = await supabase
          .from("contracts")
          .update({ contract_file: filePath })
          .eq("id", selectedContract.id);

        if (updateError) throw updateError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: "Contract updated successfully",
        description: "The contract details have been updated.",
      });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error updating contract:", error);
      toast({
        title: "Failed to update contract",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a contract
  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Also delete the file from storage if it exists
      const contract = contracts.find(c => c.id === id);
      if (contract?.contract_file) {
        const { error: deleteFileError } = await supabase.storage
          .from("documents")
          .remove([contract.contract_file]);

        if (deleteFileError) console.error("Error deleting file:", deleteFileError);
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: "Contract deleted",
        description: "The contract has been removed from the system.",
      });
    },
    onError: (error) => {
      console.error("Error deleting contract:", error);
      toast({
        title: "Failed to delete contract",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Function to download contract file
  const downloadContract = async (contract: Contract) => {
    if (!contract.contract_file) {
      toast({
        title: "No file available",
        description: "This contract doesn't have an associated file.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(contract.contract_file);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = contract.contract_file.split("/").pop() || "contract";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: "The contract file is being downloaded.",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description: "Failed to download the contract file.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      client_name: "",
      status: "pending",
      start_date: "",
      end_date: "",
    });
    setContractFile(null);
    setSelectedContract(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContractFile(e.target.files[0]);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addContractMutation.mutate({
      ...formData,
      created_at: new Date().toISOString(),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateContractMutation.mutate(formData);
  };

  const openEditDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setFormData({
      name: contract.name,
      client_name: contract.client_name,
      status: contract.status,
      start_date: contract.start_date,
      end_date: contract.end_date,
    });
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (contract: Contract) => {
    if (window.confirm(`Are you sure you want to delete the contract "${contract.name}"?`)) {
      deleteContractMutation.mutate(contract.id);
    }
  };

  // Filter contracts based on search query
  const filteredContracts = contracts.filter((contract) =>
    contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group contracts by status
  const activeContracts = filteredContracts.filter((c) => c.status === "active");
  const pendingContracts = filteredContracts.filter((c) => c.status === "pending");
  const expiredContracts = filteredContracts.filter((c) => c.status === "expired");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contracts Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Contract
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search contracts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract List</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({filteredContracts.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeContracts.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingContracts.length})</TabsTrigger>
              <TabsTrigger value="expired">Expired ({expiredContracts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ContractTable
                contracts={filteredContracts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={downloadContract}
              />
            </TabsContent>

            <TabsContent value="active">
              <ContractTable
                contracts={activeContracts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={downloadContract}
              />
            </TabsContent>

            <TabsContent value="pending">
              <ContractTable
                contracts={pendingContracts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={downloadContract}
              />
            </TabsContent>

            <TabsContent value="expired">
              <ContractTable
                contracts={expiredContracts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={downloadContract}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Contract Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Contract</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Contract Name
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
                <Label htmlFor="client_name" className="text-right">
                  Client
                </Label>
                <Input
                  id="client_name"
                  name="client_name"
                  value={formData.client_name}
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
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_date" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_date" className="text-right">
                  End Date
                </Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contract_file" className="text-right">
                  Upload File
                </Label>
                <Input
                  id="contract_file"
                  name="contract_file"
                  type="file"
                  onChange={handleFileChange}
                  className="col-span-3"
                  accept=".pdf,.doc,.docx"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addContractMutation.isPending}>
                {addContractMutation.isPending ? "Saving..." : "Save Contract"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Contract Name
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
                <Label htmlFor="edit-client_name" className="text-right">
                  Client
                </Label>
                <Input
                  id="edit-client_name"
                  name="client_name"
                  value={formData.client_name}
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
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-start_date" className="text-right">
                  Start Date
                </Label>
                <Input
                  id="edit-start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-end_date" className="text-right">
                  End Date
                </Label>
                <Input
                  id="edit-end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contract_file" className="text-right">
                  Upload New File
                </Label>
                <Input
                  id="edit-contract_file"
                  name="contract_file"
                  type="file"
                  onChange={handleFileChange}
                  className="col-span-3"
                  accept=".pdf,.doc,.docx"
                />
              </div>
              {selectedContract?.contract_file && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right">Current File</div>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    A file is already attached
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateContractMutation.isPending}>
                {updateContractMutation.isPending ? "Updating..." : "Update Contract"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Contract Table Component
interface ContractTableProps {
  contracts: Contract[];
  onEdit: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  onDownload: (contract: Contract) => void;
}

const ContractTable = ({ contracts, onEdit, onDelete, onDownload }: ContractTableProps) => {
  if (contracts.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No contracts found</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">{contract.name}</TableCell>
              <TableCell>{contract.client_name}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    contract.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                      : contract.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                      : "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                  }`}
                >
                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                </span>
              </TableCell>
              <TableCell>{new Date(contract.start_date).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(contract.end_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(contract)}
                    title="Edit contract"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(contract)}
                    title="Delete contract"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {contract.contract_file && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(contract)}
                      title="Download contract"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
