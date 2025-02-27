
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Receipt,
  ArrowUpDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function Invoices() {
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column and default to descending
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage client invoices</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(0)} collected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              0 paid
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              0% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              0% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-8 text-center">
        <Receipt className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Invoices Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You haven't created any invoices yet. Get started by creating your first invoice.
        </p>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mt-8">
        <p>Note: The invoices feature needs to be set up in the database first.</p>
        <p>Please create the invoices table in Supabase with the required schema.</p>
      </div>
    </div>
  );
}
