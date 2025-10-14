import React from "react";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import FinanceInvoices from "@/components/departments/finance/FinanceInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Invoices() {
  const { domain } = useTenantScope();

  // Only finance department can access invoices
  if (domain !== "finance") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Invoice management is only available to the finance department.
            </p>
          </CardContent>
        </Card>
    </div>
  );
  }

  return <FinanceInvoices />;
}
