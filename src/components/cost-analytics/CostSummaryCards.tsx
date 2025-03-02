
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Truck, TrendingUp } from "lucide-react";

type CostData = {
  maintenance: number;
  fuel: number;
  total: number;
};

interface CostSummaryCardsProps {
  summaryCosts: CostData;
  selectedYear: string;
}

export const CostSummaryCards = ({ summaryCosts, selectedYear }: CostSummaryCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summaryCosts.total.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">For year {selectedYear}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summaryCosts.maintenance.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {summaryCosts.total > 0 
              ? `${Math.round((summaryCosts.maintenance / summaryCosts.total) * 100)}% of total costs`
              : '0% of total costs'}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fuel Costs</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summaryCosts.fuel.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {summaryCosts.total > 0 
              ? `${Math.round((summaryCosts.fuel / summaryCosts.total) * 100)}% of total costs`
              : '0% of total costs'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
