
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

const quotations = [
  {
    id: "Q001",
    date: "2024-02-15",
    client: "Acme Corporation",
    status: "Pending",
    amount: 1250.00,
    validUntil: "2024-03-15",
  },
  {
    id: "Q002",
    date: "2024-02-14",
    client: "Sarah Johnson",
    status: "Approved",
    amount: 850.00,
    validUntil: "2024-03-14",
  },
];

export default function Quotations() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Quotations</h2>
          <p className="text-muted-foreground">Manage client quotations</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Quotation
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount (USD)</TableHead>
              <TableHead>Valid Until</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((quote) => (
              <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>{quote.id}</TableCell>
                <TableCell>{quote.date}</TableCell>
                <TableCell>{quote.client}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    quote.status === "Approved" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {quote.status}
                  </span>
                </TableCell>
                <TableCell>${quote.amount.toFixed(2)}</TableCell>
                <TableCell>{quote.validUntil}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
