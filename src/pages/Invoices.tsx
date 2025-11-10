import { useState, useMemo } from "react";
import { useInvoices } from "@/components/invoices/hooks/useInvoices";
import { useInvoiceMutations } from "@/components/invoices/hooks/useInvoiceMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
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
  CreditCard,
  Mail,
  Download,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import {
  InvoiceFormDialog,
  ViewInvoiceDialog,
  RecordPaymentDialog,
  DeleteInvoiceDialog,
} from "@/components/invoices/InvoiceDialogs";
import { DisplayInvoice, InvoiceStatus } from "@/lib/types/invoice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
} from "@/lib/invoice-helpers";

interface InvoiceAnalytics {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalValue: number;
  paidValue: number;
  outstandingValue: number;
  overdueValue: number;
  avgInvoiceValue: number;
}

export default function Invoices() {
  const {
    invoices,
    clients,
    filteredInvoices,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    refetch,
  } = useInvoices();
  const { deleteInvoice } = useInvoiceMutations();

  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<DisplayInvoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<DisplayInvoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<DisplayInvoice | null>(
    null
  );
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate analytics
  const analytics = useMemo((): InvoiceAnalytics => {
    if (!invoices) {
      return {
        total: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
        totalValue: 0,
        paidValue: 0,
        outstandingValue: 0,
        overdueValue: 0,
        avgInvoiceValue: 0,
      };
    }

    const safe = invoices.filter((i): i is DisplayInvoice => i != null);
    const total = safe.length;
    const draft = safe.filter((i) => i.status === "draft").length;
    const sent = safe.filter((i) => i.status === "sent").length;
    const paid = safe.filter((i) => i.status === "paid").length;
    const overdue = safe.filter((i) => i.status === "overdue").length;
    const cancelled = safe.filter((i) => i.status === "cancelled").length;

    const totalValue = safe.reduce((sum, i) => sum + (i?.total_amount || 0), 0);
    const paidValue = safe.reduce((sum, i) => sum + (i?.paid_amount || 0), 0);
    const outstandingValue = safe
      .filter((i) => i.status !== "paid" && i.status !== "cancelled")
      .reduce(
        (sum, i) => sum + ((i?.total_amount || 0) - (i?.paid_amount || 0)),
        0
      );
    const overdueValue = safe
      .filter((i) => i.status === "overdue")
      .reduce(
        (sum, i) => sum + ((i?.total_amount || 0) - (i?.paid_amount || 0)),
        0
      );
    const avgInvoiceValue = total > 0 ? totalValue / total : 0;

    return {
      total,
      draft,
      sent,
      paid,
      overdue,
      cancelled,
      totalValue,
      paidValue,
      outstandingValue,
      overdueValue,
      avgInvoiceValue,
    };
  }, [invoices]);

  // Enhanced filtering
  const enhancedFilteredInvoices = useMemo(() => {
    if (!invoices) return [];

    let filtered = invoices.filter(
      (invoice): invoice is DisplayInvoice => invoice != null
    );

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          (invoice.client_name?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (invoice.id?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (invoice.notes?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          )
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    // Apply client filter
    if (clientFilter !== "all") {
      filtered = filtered.filter(
        (invoice) => invoice.client_id === clientFilter
      );
    }

    return filtered;
  }, [invoices, searchTerm, statusFilter, clientFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case "draft":
        return <Edit className="h-3 w-3" />;
      case "sent":
        return <Mail className="h-3 w-3" />;
      case "paid":
        return <CheckCircle className="h-3 w-3" />;
      case "overdue":
        return <AlertCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatId = (id: string) => {
    if (!id) return "UNKNOWN";
    try {
      return id.substring(0, 8).toUpperCase();
    } catch (error) {
      console.error("Error formatting ID:", error);
      return "UNKNOWN";
    }
  };

  const handleEdit = (invoice: DisplayInvoice) => {
    setEditInvoice(invoice);
    setCreateInvoiceOpen(true);
  };

  const handleCreateOpen = () => {
    setEditInvoice(null);
    setCreateInvoiceOpen(true);
  };

  const handleDelete = (id: string) => {
    setInvoiceToDelete(id);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete);
      setInvoiceToDelete(null);
      if (viewInvoice?.id === invoiceToDelete) setViewInvoice(null);
      if (editInvoice?.id === invoiceToDelete) setEditInvoice(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Invoices
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
              <Button onClick={handleCreateOpen}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">
                Total Invoices
              </CardTitle>
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold">{analytics.total}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {analytics.draft} draft, {analytics.sent} sent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold">
                {formatCurrency(analytics.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Avg: {formatCurrency(analytics.avgInvoiceValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold text-orange-600">
                {formatCurrency(analytics.outstandingValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {analytics.sent + analytics.overdue} unpaid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">Paid Value</CardTitle>
              <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(analytics.paidValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {analytics.paid} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-3">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            </CardHeader>
            <CardContent className="px-3 pb-2 pt-0.5">
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(analytics.overdueValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {analytics.overdue} overdue invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices by client, ID, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            <InvoicesTable
              invoices={enhancedFilteredInvoices.filter(
                (invoice): invoice is DisplayInvoice => invoice !== null
              )}
              onView={setViewInvoice}
              onEdit={handleEdit}
              onRecordPayment={setPaymentInvoice}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        <InvoiceFormDialog
          isOpen={createInvoiceOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCreateInvoiceOpen(false);
              setEditInvoice(null);
            } else {
              setCreateInvoiceOpen(true);
            }
          }}
          editInvoice={editInvoice}
          clients={clients}
        />

        <ViewInvoiceDialog
          isOpen={!!viewInvoice}
          onOpenChange={() => setViewInvoice(null)}
          invoice={viewInvoice}
          onRecordPayment={setPaymentInvoice}
        />

        <RecordPaymentDialog
          isOpen={!!paymentInvoice}
          onOpenChange={() => setPaymentInvoice(null)}
          invoice={paymentInvoice}
        />

        <DeleteInvoiceDialog
          isOpen={!!invoiceToDelete}
          onOpenChange={() => setInvoiceToDelete(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}