
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Filter, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InvoiceAccessProps {
  clientUserId?: string;
}

export function InvoiceAccess({ clientUserId }: InvoiceAccessProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["client-invoices", clientUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching invoices:", error);
        throw error;
      }
      return data;
    },
  });

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const invoiceDate = new Date(invoice.date);
      const now = new Date();
      
      switch (dateFilter) {
        case "this_month":
          matchesDate = invoiceDate.getMonth() === now.getMonth() && 
                       invoiceDate.getFullYear() === now.getFullYear();
          break;
        case "last_month":
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          matchesDate = invoiceDate.getMonth() === lastMonth.getMonth() && 
                       invoiceDate.getFullYear() === lastMonth.getFullYear();
          break;
        case "this_year":
          matchesDate = invoiceDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "sent": return "secondary";
      case "draft": return "outline";
      case "overdue": return "destructive";
      default: return "outline";
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Download Started",
      description: "Invoice download will be available soon.",
    });
    console.log("Downloading invoice:", invoiceId);
  };

  const handleViewInvoice = (invoiceId: string) => {
    toast({
      title: "Opening Invoice",
      description: "Invoice viewer will be available soon.",
    });
    console.log("Viewing invoice:", invoiceId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">Loading invoices...</div>
        </CardContent>
      </Card>
    );
  }

  const totalPaid = invoices?.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
  const totalOutstanding = invoices?.filter(inv => inv.status === "sent").reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoices & Billing
        </CardTitle>
        <CardDescription>
          Access and download your invoices and billing information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Search invoice ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                ${totalPaid.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total Paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                ${totalOutstanding.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {invoices?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Invoices</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice List */}
        <div className="space-y-4">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="font-medium">Invoice #{invoice.id.slice(0, 8)}</div>
                    <div className="text-sm text-muted-foreground">
                      Date: {new Date(invoice.date).toLocaleDateString()}
                    </div>
                    {invoice.due_date && (
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                    <div className="text-lg font-semibold">
                      ${Number(invoice.total_amount).toLocaleString()}
                    </div>
                  </div>
                </div>

                {invoice.payment_date && (
                  <div className="text-sm text-muted-foreground mb-3">
                    Paid on: {new Date(invoice.payment_date).toLocaleDateString()}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    {invoice.items && Array.isArray(invoice.items) 
                      ? `${invoice.items.length} item${invoice.items.length !== 1 ? 's' : ''}`
                      : "No items"
                    }
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewInvoice(invoice.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                ? "No invoices match your search criteria"
                : "No invoices found"
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
