
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { YearComparisonData } from "@/lib/types/cost-analytics";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";

interface ComparisonTabProps {
  comparisonData: YearComparisonData | null;
}

export const ComparisonTab = ({ comparisonData }: ComparisonTabProps) => {
  if (!comparisonData) {
    return (
      <TabsContent value="comparison" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Year-over-Year Comparison</CardTitle>
            <CardDescription>
              Select a previous year to compare costs
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No comparison data available. Please select a different year.</p>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  const { currentYear, previousYear, maintenance, fuel, total } = comparisonData;

  // Create data for comparison chart
  const chartData = [
    {
      category: "Maintenance",
      [previousYear]: maintenance.previous,
      [currentYear]: maintenance.current,
    },
    {
      category: "Fuel",
      [previousYear]: fuel.previous,
      [currentYear]: fuel.current,
    },
    {
      category: "Total",
      [previousYear]: total.previous,
      [currentYear]: total.current,
    },
  ];

  const renderPercentChange = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-red-500">
          <ArrowUpIcon className="h-4 w-4 mr-1" />
          {value.toFixed(1)}%
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-green-500">
          <ArrowDownIcon className="h-4 w-4 mr-1" />
          {Math.abs(value).toFixed(1)}%
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-muted-foreground">
          <MinusIcon className="h-4 w-4 mr-1" />
          0%
        </div>
      );
    }
  };

  return (
    <TabsContent value="comparison" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year Comparison</CardTitle>
          <CardDescription>
            Comparing costs between {currentYear} and {previousYear}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: '6px' 
                }}
              />
              <Legend />
              <Bar name={previousYear} dataKey={previousYear} fill="#8884d8" />
              <Bar name={currentYear} dataKey={currentYear} fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">${maintenance.current.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">vs ${maintenance.previous.toFixed(2)}</p>
              </div>
              <div className="text-lg">
                {renderPercentChange(maintenance.percentChange)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">${fuel.current.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">vs ${fuel.previous.toFixed(2)}</p>
              </div>
              <div className="text-lg">
                {renderPercentChange(fuel.percentChange)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">${total.current.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">vs ${total.previous.toFixed(2)}</p>
              </div>
              <div className="text-lg">
                {renderPercentChange(total.percentChange)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};
