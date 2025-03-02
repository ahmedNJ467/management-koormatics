
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type MonthlyData = {
  month: string;
  maintenance: number;
  fuel: number;
  total: number;
};

interface OverviewTabProps {
  monthlyData: MonthlyData[];
}

export const OverviewTab = ({ monthlyData }: OverviewTabProps) => {
  return (
    <TabsContent value="overview" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cost Breakdown</CardTitle>
          <CardDescription>
            View maintenance and fuel costs by month
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
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
              <Bar name="Maintenance" dataKey="maintenance" fill="#0088FE" />
              <Bar name="Fuel" dataKey="fuel" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Trend</CardTitle>
          <CardDescription>Monthly total cost trend</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
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
              <Line type="monotone" name="Total Cost" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </TabsContent>
  );
};
