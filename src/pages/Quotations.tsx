import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Mail,
  FileText,
  MoreHorizontal,
  Copy,
  Trash,
  Loader2,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Users,
  Eye,
  Edit,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QuotationFormDialog } from "@/components/quotation-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  QuotationItem,
  QuotationStatus,
  Client,
  DisplayQuotation,
} from "@/lib/types";
import { TableFooter } from "@/components/ui/table";
import { calculateTotal, formatCurrency } from "@/lib/invoice-helpers";
import {
  generateQuotationPDF,
  sendQuotationByEmail,
} from "@/lib/quotation-helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeArrayResult } from "@/lib/utils/type-guards";

interface QuotationAnalytics {
  total: number;
  draft: number;
  sent: number;
  approved: number;
  rejected: number;
  expired: number;
  totalValue: number;
  avgValue: number;
  pendingValue: number;
  approvedValue: number;
}

export default function Quotations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "all">(
    "all"
  );
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] =
    useState<DisplayQuotation | null>(null);
  const [quotationToDelete, setQuotationToDelete] =
    useState<DisplayQuotation | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [viewQuotation, setViewQuotation] = useState<DisplayQuotation | null>(
    null
  );
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Get quotations
  const {
    data: quotations,
    isLoading: quotationsLoading,
    refetch,
  } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(
          `
          *,
          clients:client_id(name, email, address, phone)
        `
        )
        .order("date", { ascending: false });

      if (error) throw error;

      // Map the data to match our Quotation interface
      return data.map((quote: any) => ({
        id: quote.id,
        date: quote.date,
        client_id: quote.client_id,
        client_name: quote.clients?.name || "Unknown Client",
        client_email: quote.clients?.email,
        client_address: quote.clients?.address,
        client_phone: quote.clients?.phone,
        status: quote.status as QuotationStatus,
        total_amount: quote.total_amount,
        valid_until: quote.valid_until,
        notes: quote.notes,
        items: quote.items as unknown as QuotationItem[],
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        vat_percentage: quote.vat_percentage,
        discount_percentage: quote.discount_percentage,
      })) as DisplayQuotation[];
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel("quotations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotations" },
        () => {
          // Force refresh the quotations data when any changes occur
          queryClient.invalidateQueries({ queryKey: ["quotations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Get clients for the form and filtering
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email")
        .order("name");

      if (error) throw error;
      return safeArrayResult<Client>(data);
    },
  });

  // Calculate analytics
  const analytics = useMemo((): QuotationAnalytics => {
    if (!quotations) {
      return {
        total: 0,
        draft: 0,
        sent: 0,
        approved: 0,
        rejected: 0,
        expired: 0,
        totalValue: 0,
        avgValue: 0,
        pendingValue: 0,
        approvedValue: 0,
      };
    }

    const total = quotations.length;
    const draft = quotations.filter((q) => q.status === "draft").length;
    const sent = quotations.filter((q) => q.status === "sent").length;
    const approved = quotations.filter((q) => q.status === "approved").length;
    const rejected = quotations.filter((q) => q.status === "rejected").length;
    const expired = quotations.filter((q) => q.status === "expired").length;

    const totalValue = quotations.reduce(
      (sum, q) => sum + (q.total_amount || 0),
      0
    );
    const avgValue = total > 0 ? totalValue / total : 0;
    const pendingValue = quotations
      .filter((q) => q.status === "sent" || q.status === "draft")
      .reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const approvedValue = quotations
      .filter((q) => q.status === "approved")
      .reduce((sum, q) => sum + (q.total_amount || 0), 0);

    return {
      total,
      draft,
      sent,
      approved,
      rejected,
      expired,
      totalValue,
      avgValue,
      pendingValue,
      approvedValue,
    };
  }, [quotations]);

  // Filter quotations
  const filteredQuotations = useMemo(() => {
    if (!quotations) return [];

    let filtered = quotations;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (quote) =>
          (quote.client_name?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (quote.id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (quote.notes?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((quote) => quote.status === statusFilter);
    }

    // Apply client filter
    if (clientFilter !== "all") {
      filtered = filtered.filter((quote) => quote.client_id === clientFilter);
    }

    return filtered;
  }, [quotations, searchTerm, statusFilter, clientFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open);
    // When dialog closes, reset the selected quotation
    if (!open) {
      setSelectedQuotation(null);
    }
  }, []);

  const handleQuotationClick = useCallback((quotation: DisplayQuotation) => {
    setSelectedQuotation(quotation);
    setFormOpen(true);
  }, []);

  const handleViewQuotation = useCallback((quotation: DisplayQuotation) => {
    setViewQuotation(quotation);
  }, []);

  const handleViewDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setViewQuotation(null);
    }
  }, []);

  const handleDeleteClick = useCallback((quotation: DisplayQuotation) => {
    setQuotationToDelete(quotation);
    setShowDeleteAlert(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!quotationToDelete || !quotationToDelete.id) return;

    try {
      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", quotationToDelete.id as any);

      if (error) throw error;

      toast({
        title: "Quotation deleted",
        description: "The quotation has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to delete the quotation.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteAlert(false);
      setQuotationToDelete(null);
    }
  };

  const handleSendQuotation = async (quotation: DisplayQuotation) => {
    if (!quotation) return;
    setIsSending(true);
    const success = await sendQuotationByEmail(quotation);

    // Only invalidate and close dialog on success
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      setViewQuotation(null);
    }

    setIsSending(false);
  };

  const handleDuplicateQuotation = async (quotation: DisplayQuotation) => {
    try {
      // Create a new quotation based on the existing one
      const newQuotation = {
        client_id: quotation.client_id,
        date: new Date().toISOString().split("T")[0], // Today's date
        status: "draft" as QuotationStatus,
        total_amount: quotation.total_amount,
        valid_until: new Date(new Date().setDate(new Date().getDate() + 30))
          .toISOString()
          .split("T")[0], // 30 days from now
        notes: quotation.notes,
        items: quotation.items as any,
      };

      const { error } = await supabase
        .from("quotations")
        .insert([newQuotation] as any);

      if (error) throw error;

      toast({
        title: "Quotation duplicated",
        description: "A new draft quotation has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    } catch (error) {
      console.error("Error duplicating quotation:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the quotation.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: QuotationStatus) => {
    if (!status) return "bg-gray-100 text-gray-700";

    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "expired":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: QuotationStatus) => {
    switch (status) {
      case "draft":
        return <Edit className="h-3 w-3" />;
      case "sent":
        return <Send className="h-3 w-3" />;
      case "approved":
        return <CheckCircle className="h-3 w-3" />;
      case "rejected":
        return <XCircle className="h-3 w-3" />;
      case "expired":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Format the ID to show only the short version
  const formatId = (id: string) => {
    if (!id) return "UNKNOWN";
    // Return just the first 8 characters of the UUID
    try {
      return id.substring(0, 8).toUpperCase();
    } catch (error) {
      console.error("Error formatting ID:", error);
      return "UNKNOWN";
    }
  };

  // Safe format function for dates
  const safeFormatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "Unknown date";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  if (quotationsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Quotations
            </h2>
            <p className="text-muted-foreground">Loading quotations...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </CardTitle>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground">
            Manage and track your client quotations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Quotations
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.draft} draft, {analytics.sent} sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(analytics.avgValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.pendingValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.draft + analytics.sent} quotations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.approvedValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.approved} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotations by client, ID, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as QuotationStatus | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quotations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quotations</CardTitle>
              <CardDescription>
                {filteredQuotations.length} of {analytics.total} quotations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center h-24 text-muted-foreground"
                    >
                      {searchTerm ||
                      statusFilter !== "all" ||
                      clientFilter !== "all"
                        ? "No quotations match your filters."
                        : "No quotations found. Create your first quotation!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quote) => (
                    <TableRow key={quote.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {formatId(quote.id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{safeFormatDate(quote.date)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {quote.client_name || "Unknown Client"}
                          </div>
                          {quote.client_email && (
                            <div className="text-sm text-muted-foreground">
                              {quote.client_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(
                            quote.status
                          )} flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(quote.status)}
                          {quote.status
                            ? quote.status.charAt(0).toUpperCase() +
                              quote.status.slice(1)
                            : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(quote.total_amount || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`${
                            new Date(quote.valid_until) < new Date()
                              ? "text-red-600"
                              : ""
                          }`}
                        >
                          {safeFormatDate(quote.valid_until)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewQuotation(quote)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuotationClick(quote)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleViewQuotation(quote)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleQuotationClick(quote)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => generateQuotationPDF(quote)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSendQuotation(quote)}
                                disabled={
                                  quote.status === "sent" ||
                                  quote.status === "approved" ||
                                  isSending
                                }
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send PDF to Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDuplicateQuotation(quote)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(quote)}
                                className="text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quotation form dialog */}
      <QuotationFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        quotation={selectedQuotation}
        clients={clients || []}
      />

      {/* Quotation view dialog */}
      <Dialog open={!!viewQuotation} onOpenChange={handleViewDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Quotation Details</DialogTitle>
          {viewQuotation && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    #{formatId(viewQuotation.id)}
                  </h3>
                  <p className="text-muted-foreground">
                    Created: {safeFormatDate(viewQuotation.date)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(
                    viewQuotation.status
                  )} flex items-center gap-1`}
                >
                  {getStatusIcon(viewQuotation.status)}
                  {viewQuotation.status
                    ? viewQuotation.status.charAt(0).toUpperCase() +
                      viewQuotation.status.slice(1)
                    : "Unknown"}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Client Information
                  </h4>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {viewQuotation.client_name || "Unknown Client"}
                    </p>
                    {viewQuotation.client_email && (
                      <p className="text-sm text-muted-foreground">
                        {viewQuotation.client_email}
                      </p>
                    )}
                    {viewQuotation.client_phone && (
                      <p className="text-sm text-muted-foreground">
                        {viewQuotation.client_phone}
                      </p>
                    )}
                    {viewQuotation.client_address && (
                      <p className="text-sm text-muted-foreground">
                        {viewQuotation.client_address}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Quotation Details
                  </h4>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Valid Until:</span>{" "}
                      {safeFormatDate(viewQuotation.valid_until)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Total Amount:</span>{" "}
                      {formatCurrency(viewQuotation.total_amount)}
                    </p>
                    {viewQuotation.vat_percentage && (
                      <p className="text-sm">
                        <span className="font-medium">VAT:</span>{" "}
                        {viewQuotation.vat_percentage}%
                      </p>
                    )}
                    {viewQuotation.discount_percentage && (
                      <p className="text-sm">
                        <span className="font-medium">Discount:</span>{" "}
                        {viewQuotation.discount_percentage}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {viewQuotation.notes && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-muted-foreground bg-muted p-3 rounded-md">
                    {viewQuotation.notes}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewQuotation.items &&
                      Array.isArray(viewQuotation.items) ? (
                        viewQuotation.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {item?.description || "Unknown item"}
                            </TableCell>
                            <TableCell className="text-right">
                              {item?.quantity || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item?.unit_price || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item?.amount || 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No items found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(calculateTotal(viewQuotation.items))}
                        </TableCell>
                      </TableRow>
                      {viewQuotation.vat_percentage &&
                        viewQuotation.vat_percentage > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-right">
                              VAT ({viewQuotation.vat_percentage}%)
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(
                                calculateTotal(viewQuotation.items) *
                                  (viewQuotation.vat_percentage / 100)
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      {viewQuotation.discount_percentage &&
                        viewQuotation.discount_percentage > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-right">
                              Discount ({viewQuotation.discount_percentage}%)
                            </TableCell>
                            <TableCell className="text-right">
                              -
                              {formatCurrency(
                                calculateTotal(viewQuotation.items) *
                                  (viewQuotation.discount_percentage / 100)
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      <TableRow className="font-bold border-t">
                        <TableCell colSpan={3} className="text-right">
                          Total
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(viewQuotation.total_amount)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>

              <DialogFooter className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setViewQuotation(null)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateQuotationPDF(viewQuotation)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => handleSendQuotation(viewQuotation)}
                  disabled={
                    viewQuotation.status === "sent" ||
                    viewQuotation.status === "approved" ||
                    isSending
                  }
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending PDF...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send PDF to Client
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm deletion dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the quotation "
              {quotationToDelete?.client_name}" -{" "}
              {formatId(quotationToDelete?.id || "")}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Quotation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
