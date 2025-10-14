import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  FileText,
  CreditCard,
  PieChart,
  Calculator,
} from "lucide-react";

export default function FinanceDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Finance Center</h1>
        <div className="text-sm text-muted-foreground">
          Financial management and analytics
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$124,500</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$18,750</div>
            <p className="text-xs text-muted-foreground">12 pending payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Operating Costs
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,200</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">63.7%</div>
            <p className="text-xs text-muted-foreground">Net profit margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Create, manage, and track invoices and payments.
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">
                View Invoices
              </button>
              <button className="px-3 py-1 border border-border rounded-md text-sm">
                Create Invoice
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cost Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Analyze costs, profitability, and financial performance.
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm">
                Cost Analysis
              </button>
              <button className="px-3 py-1 border border-border rounded-md text-sm">
                Trip Finance
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Paid this month</span>
                <span className="text-green-600">$105,750</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending payments</span>
                <span className="text-yellow-600">$18,750</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Overdue</span>
                <span className="text-red-600">$2,400</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>This month</span>
                <span className="text-green-600">+8.2%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last quarter</span>
                <span className="text-green-600">+12.5%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Year to date</span>
                <span className="text-green-600">+15.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
