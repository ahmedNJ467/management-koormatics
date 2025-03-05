
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { VehicleCostData } from "@/lib/types/cost-analytics";
import { COLORS } from "@/lib/types/cost-analytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

interface VehiclesTabProps {
  vehicleCosts: VehicleCostData[];
}

export const VehiclesTab = ({ vehicleCosts }: VehiclesTabProps) => {
  // Calculate the total for all vehicles
  const totalCost = vehicleCosts.reduce((sum, vehicle) => sum + vehicle.total, 0);
  
  // Create data for the pie chart (top 5 vehicles by cost)
  const pieData = [...vehicleCosts]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map(vehicle => ({
      name: vehicle.vehicle_name.split(' ')[0] + ' ' + vehicle.vehicle_name.split(' ')[1], // Just make the names shorter
      value: vehicle.total
    }));
    
  // If there are more than 5 vehicles, add an "Others" category
  if (vehicleCosts.length > 5) {
    const othersTotal = vehicleCosts
      .sort((a, b) => b.total - a.total)
      .slice(5)
      .reduce((sum, vehicle) => sum + vehicle.total, 0);
      
    pieData.push({
      name: 'Others',
      value: othersTotal
    });
  }
  
  return (
    <TabsContent value="vehicles" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Vehicle</CardTitle>
            <CardDescription>
              Maintenance and fuel costs comparison
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
        
        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
            <CardDescription>
              Percentage of total fleet costs by vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[500px] w-full">
            {totalCost > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: '6px' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <AlertCircle className="h-8 w-8 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">No cost data available</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Cost Ranking</CardTitle>
          <CardDescription>
            Vehicles ranked by total cost (highest to lowest)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicleCosts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>% of Fleet Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleCosts.map((vehicle, index) => {
                  const percentage = totalCost > 0 
                    ? (vehicle.total / totalCost) * 100 
                    : 0;
                    
                  return (
                    <TableRow key={vehicle.vehicle_id} className={index === 0 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{vehicle.vehicle_name}</TableCell>
                      <TableCell className="font-medium">${vehicle.total.toFixed(2)}</TableCell>
                      <TableCell>${vehicle.maintenance.toFixed(2)}</TableCell>
                      <TableCell>${vehicle.fuel.toFixed(2)}</TableCell>
                      <TableCell>{percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <AlertCircle className="mr-2 h-4 w-4" />
              No cost data available
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};
