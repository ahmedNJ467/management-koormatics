import { useState, useEffect } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ContractTable from "@/components/contracts/ContractTable";
import AddContractDialog from "@/components/contracts/AddContractDialog";
import EditContractDialog from "@/components/contracts/EditContractDialog";
import {
  fetchContracts,
  addContract,
  updateContract,
  deleteContract,
  downloadContractFile,
} from "@/components/contracts/ContractService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
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
  const [isStorageAvailable, setIsStorageAvailable] = useState<boolean>(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading, isError } = useQuery({
    queryKey: ["contracts"],
    queryFn: fetchContracts,
  });

  useEffect(() => {
    const checkStorage = async () => {
      try {
        console.log("Checking storage availability...");
        const { data, error } = await supabase.storage.from('documents').list();
        
        if (error) {
          console.error("Storage check error:", error);
          setIsStorageAvailable(false);
          setStorageError(error.message);
        } else {
          console.log("Storage is available, found", data?.length, "files");
          setIsStorageAvailable(true);
          setStorageError(null);
        }
      } catch (error) {
        console.error("Storage check exception:", error);
        setIsStorageAvailable(false);
        setStorageError(error instanceof Error ? error.message : "Unknown error");
      }
    };
    
    checkStorage();
  }, []);

  const addContractMutation = useMutation({
    mutationFn: async (newContract: Partial<Contract>) => {
      return addContract(newContract, contractFile);
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

  const updateContractMutation = useMutation({
    mutationFn: async (updatedContract: Partial<Contract>) => {
      if (!selectedContract?.id) throw new Error("No contract selected");
      return updateContract(selectedContract.id, updatedContract, contractFile);
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

  const deleteContractMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
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

  const handleDownloadContract = async (contract: Contract) => {
    try {
      const data = await downloadContractFile(contract);
      
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = contract.contract_file?.split("/").pop() || "contract";
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

  const filteredContracts = contracts.filter((contract) =>
    contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeContracts = filteredContracts.filter((c) => c.status === "active");
  const pendingContracts = filteredContracts.filter((c) => c.status === "pending");
  const expiredContracts = filteredContracts.filter((c) => c.status === "expired");

  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load contracts data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contracts Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Contract
        </Button>
      </div>

      {!isStorageAvailable && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage Service Issue</AlertTitle>
          <AlertDescription>
            Document uploads and downloads are currently unavailable. 
            {storageError && <div className="mt-2 text-sm">Error: {storageError}</div>}
            <div className="mt-2">
              Contracts can still be managed, but without document attachments.
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                onDownload={handleDownloadContract}
              />
            </TabsContent>

            <TabsContent value="active">
              <ContractTable
                contracts={activeContracts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={handleDownloadContract}
              />
            </TabsContent>

            <TabsContent value="pending">
              <ContractTable
                contracts={pendingContracts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={handleDownloadContract}
              />
            </TabsContent>

            <TabsContent value="expired">
              <ContractTable
                contracts={expiredContracts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={handleDownloadContract}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AddContractDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        formData={formData as any}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleSubmit={handleAddSubmit}
        isPending={addContractMutation.isPending}
        isStorageAvailable={isStorageAvailable}
      />

      <EditContractDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        formData={formData}
        selectedContract={selectedContract}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        handleSubmit={handleEditSubmit}
        isPending={updateContractMutation.isPending}
        isStorageAvailable={isStorageAvailable}
      />
    </div>
  );
}
