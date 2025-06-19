import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  LayoutGrid,
  LayoutList,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ContractTable from "@/components/contracts/ContractTable";
import ContractsSummaryDashboard from "@/components/contracts/ContractsSummaryDashboard";
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
import { supabase } from "@/integrations/supabase/client";

export interface Contract {
  id: string;
  name: string;
  client_name: string;
  status: "active" | "expired" | "pending" | "terminated";
  start_date: string;
  end_date: string;
  created_at: string;
  contract_file?: string;
}

export default function Contracts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "name" | "client_name" | "start_date" | "end_date" | "created_at"
  >("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
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

  const {
    data: contracts = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["contracts"],
    queryFn: fetchContracts,
  });

  useEffect(() => {
    const checkStorage = async () => {
      try {
        console.log("Checking storage availability...");
        const { data, error } = await supabase.storage.from("documents").list();

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
        setStorageError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    };

    checkStorage();
  }, []);

  // Calculate analytics
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter((c) => c.status === "active").length;
  const pendingContracts = contracts.filter(
    (c) => c.status === "pending"
  ).length;
  const expiredContracts = contracts.filter(
    (c) => c.status === "expired"
  ).length;
  const terminatedContracts = contracts.filter(
    (c) => c.status === "terminated"
  ).length;

  // Contracts expiring soon (within 30 days)
  const soonToExpire = contracts.filter((c) => {
    if (c.status !== "active") return false;
    const endDate = new Date(c.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }).length;

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
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
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
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
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
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
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

  const handleExportContracts = async () => {
    try {
      const dataToExport = filteredAndSortedContracts;

      // Create CSV content
      const headers = [
        "Name",
        "Client",
        "Status",
        "Start Date",
        "End Date",
        "Created Date",
        "Has File",
      ];
      const csvContent = [
        headers.join(","),
        ...dataToExport.map((contract) =>
          [
            `"${contract.name}"`,
            `"${contract.client_name}"`,
            contract.status,
            contract.start_date,
            contract.end_date,
            contract.created_at,
            contract.contract_file ? "Yes" : "No",
          ].join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contracts-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: `${dataToExport.length} contracts exported successfully.`,
      });
    } catch (error) {
      console.error("Error exporting contracts:", error);
      toast({
        title: "Export failed",
        description: "Failed to export contracts. Please try again.",
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
    if (
      window.confirm(
        `Are you sure you want to delete the contract "${contract.name}"?`
      )
    ) {
      deleteContractMutation.mutate(contract.id);
    }
  };

  const handleAddButtonClick = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Enhanced filtering and sorting
  const filteredAndSortedContracts = contracts
    .filter((contract) => {
      const matchesSearch =
        contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.client_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "client_name":
          comparison = a.client_name.localeCompare(b.client_name);
          break;
        case "start_date":
          comparison =
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          break;
        case "end_date":
          comparison =
            new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

  const activeContractsFiltered = filteredAndSortedContracts.filter(
    (c) => c.status === "active"
  );
  const pendingContractsFiltered = filteredAndSortedContracts.filter(
    (c) => c.status === "pending"
  );
  const expiredContractsFiltered = filteredAndSortedContracts.filter(
    (c) => c.status === "expired"
  );
  const terminatedContractsFiltered = filteredAndSortedContracts.filter(
    (c) => c.status === "terminated"
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Contracts</h2>
            <p className="text-muted-foreground">Loading contracts...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Contracts Management
          </h2>
          <p className="text-muted-foreground">
            Manage and track your contracts and agreements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportContracts}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAddButtonClick}>
            <Plus className="mr-2 h-4 w-4" /> Add Contract
          </Button>
        </div>
      </div>

      {!isStorageAvailable && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage Service Issue</AlertTitle>
          <AlertDescription>
            Document uploads and downloads are currently unavailable.
            {storageError && (
              <div className="mt-2 text-sm">Error: {storageError}</div>
            )}
            <div className="mt-2">
              Contracts can still be managed, but without document attachments.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Dashboard */}
      <ContractsSummaryDashboard contracts={contracts} />

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Contract Management</CardTitle>
              <CardDescription>
                Search, filter, and manage your contracts
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">View:</span>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as any)}
                  size="sm"
                >
                  <ToggleGroupItem value="table" aria-label="Table view">
                    <LayoutList className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="cards" aria-label="Cards view">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort:</span>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as any)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="client_name">Client</SelectItem>
                    <SelectItem value="start_date">Start Date</SelectItem>
                    <SelectItem value="end_date">End Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contracts by name or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract List
            <Badge variant="outline">
              {filteredAndSortedContracts.length} contracts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All
                <Badge variant="secondary">
                  {filteredAndSortedContracts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Active
                <Badge variant="secondary">
                  {activeContractsFiltered.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
                <Badge variant="secondary">
                  {pendingContractsFiltered.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Expired
                <Badge variant="secondary">
                  {expiredContractsFiltered.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="terminated"
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Terminated
                <Badge variant="secondary">
                  {terminatedContractsFiltered.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ContractTable
                contracts={filteredAndSortedContracts}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={handleDownloadContract}
                viewMode={viewMode}
              />
            </TabsContent>

            <TabsContent value="active">
              <ContractTable
                contracts={activeContractsFiltered}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={handleDownloadContract}
                viewMode={viewMode}
              />
            </TabsContent>

            <TabsContent value="pending">
              <ContractTable
                contracts={pendingContractsFiltered}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={handleDownloadContract}
                viewMode={viewMode}
              />
            </TabsContent>

            <TabsContent value="expired">
              <ContractTable
                contracts={expiredContractsFiltered}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={handleDownloadContract}
                viewMode={viewMode}
              />
            </TabsContent>

            <TabsContent value="terminated">
              <ContractTable
                contracts={terminatedContractsFiltered}
                onEdit={openEditDialog}
                onDelete={confirmDelete}
                onDownload={handleDownloadContract}
                viewMode={viewMode}
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
        onDownload={handleDownloadContract}
      />
    </div>
  );
}
