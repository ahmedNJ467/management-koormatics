
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type VehicleCostData = {
  vehicle_id: string;
  vehicle_name: string;
  maintenance: number;
  fuel: number;
  total: number;
};

interface VehiclesTabProps {
  vehicleCosts: VehicleCostData[];
}

export const VehiclesTab = ({ vehicleCosts }: VehiclesTabProps) => {
  return (
    <TabsContent value="vehicles" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cost by Vehicle</CardTitle>
          <CardDescription>
            Comparison of maintenance and fuel costs across vehicles
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={vehicleCosts} 
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="vehicle_name" width={140} />
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
    </TabsContent>
  );
};
