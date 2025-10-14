import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calculator, TrendingUp, DollarSign } from "lucide-react";

export default function FinanceReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Finance Reports</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Finance Department</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Monthly Revenue Report</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">January 2024</p>
              <p className="text-sm">
                Total Revenue: <span className="text-green-600">$125,430</span>
              </p>
              <p className="text-sm">Growth: +12.5%</p>
              <p className="text-sm">Generated: 2024-02-01</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Cost Analysis Report</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Q4 2023</p>
              <p className="text-sm">
                Total Costs: <span className="text-red-600">$78,920</span>
              </p>
              <p className="text-sm">Savings: -5.2%</p>
              <p className="text-sm">Generated: 2024-01-15</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Profit Margin Report</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Annual 2023</p>
              <p className="text-sm">
                Profit Margin: <span className="text-green-600">37.2%</span>
              </p>
              <p className="text-sm">Improvement: +2.1%</p>
              <p className="text-sm">Generated: 2024-01-01</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
