import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Receipt, TrendingUp } from "lucide-react";

export default function FinanceInvoices() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Finance Invoices</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span>Finance Department</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice #INV-001</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Airport Transfer Service
              </p>
              <p className="text-sm">
                Status: <span className="text-green-600">Paid</span>
              </p>
              <p className="text-sm">Amount: $2,450.00</p>
              <p className="text-sm">Client: ABC Corporation</p>
              <p className="text-sm">Date: 2024-01-15</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice #INV-002</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">City Tour Package</p>
              <p className="text-sm">
                Status: <span className="text-yellow-600">Pending</span>
              </p>
              <p className="text-sm">Amount: $1,850.00</p>
              <p className="text-sm">Client: XYZ Travel</p>
              <p className="text-sm">Date: 2024-01-16</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice #INV-003</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Corporate Event Transport
              </p>
              <p className="text-sm">
                Status: <span className="text-red-600">Overdue</span>
              </p>
              <p className="text-sm">Amount: $3,200.00</p>
              <p className="text-sm">Client: DEF Events</p>
              <p className="text-sm">Date: 2024-01-10</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
