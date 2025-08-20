
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CombinedFinancialData } from "@/lib/financial-analytics";

interface VehicleProfitTabProps {
  data: CombinedFinancialData;
}

export function VehicleProfitTab({ data }: VehicleProfitTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Prepare chart data for top 5 vehicles
  const chartData = data.profitAnalytics.vehicleProfits
    .slice(0, 5)
    .map(vehicle => ({
      name: vehicle.vehicle_name.split(' ')[0] + ' ' + vehicle.vehicle_name.split(' ')[1],
      revenue: vehicle.revenue,
      costs: vehicle.costs,
      profit: vehicle.profit
    }));
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Profit Analysis</CardTitle>
          <CardDescription>Revenue, costs, and profit by vehicle (top 5)</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: '6px' 
                }}
              />
              <Legend />
              <Bar name="Revenue" dataKey="revenue" fill="#22c55e" />
              <Bar name="Costs" dataKey="costs" fill="#ef4444" />
              <Bar name="Profit" dataKey="profit" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Financial Details</CardTitle>
          <CardDescription>Detailed breakdown by vehicle</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Costs</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.profitAnalytics.vehicleProfits.map((vehicle, index) => (
                  <TableRow key={index}>
                    <TableCell>{vehicle.vehicle_name}</TableCell>
                    <TableCell>{formatCurrency(vehicle.revenue)}</TableCell>
                    <TableCell>{formatCurrency(vehicle.costs)}</TableCell>
                    <TableCell className={vehicle.profit >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(vehicle.profit)}
                    </TableCell>
                    <TableCell>
                      {vehicle.revenue > 0 ? ((vehicle.profit / vehicle.revenue) * 100).toFixed(1) + '%' : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
