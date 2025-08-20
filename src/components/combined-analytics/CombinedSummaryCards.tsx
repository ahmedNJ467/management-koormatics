
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CombinedFinancialData } from "@/lib/financial-analytics";
import { DollarSign, TrendingUp, TrendingDown, Coins } from "lucide-react";

interface CombinedSummaryCardsProps {
  data: CombinedFinancialData;
  selectedYear: string;
}

export function CombinedSummaryCards({ data, selectedYear }: CombinedSummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Revenue</CardTitle>
            <CardDescription>Total income for {selectedYear}</CardDescription>
          </div>
          <DollarSign className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(data.revenueAnalytics.totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            From {data.revenueAnalytics.tripCount} trips
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Expenses</CardTitle>
            <CardDescription>Total costs for {selectedYear}</CardDescription>
          </div>
          <TrendingDown className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data.costAnalytics.summaryCosts.total)}
          </div>
          <p className="text-xs text-muted-foreground">
            Maintenance & fuel expenses
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Profit</CardTitle>
            <CardDescription>Revenue minus expenses</CardDescription>
          </div>
          <Coins className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${data.profitAnalytics.totalProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {formatCurrency(data.profitAnalytics.totalProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            Margin: {data.profitAnalytics.profitMargin.toFixed(1)}%
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Cost Breakdown</CardTitle>
            <CardDescription>Maintenance vs fuel costs</CardDescription>
          </div>
          <TrendingUp className="h-5 w-5 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(data.costAnalytics.summaryCosts.maintenance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Maintenance: {((data.costAnalytics.summaryCosts.maintenance / data.costAnalytics.summaryCosts.total) * 100).toFixed(1)}%
            {" | "}
            Fuel: {((data.costAnalytics.summaryCosts.fuel / data.costAnalytics.summaryCosts.total) * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
