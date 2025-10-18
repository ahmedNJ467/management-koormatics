
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fuel, Wrench, AlertCircle } from "lucide-react";
import { VehicleCostData } from "@/lib/types/cost-analytics";

interface DetailsTabProps {
  vehicleCosts: VehicleCostData[];
}

export const DetailsTab = ({ vehicleCosts }: DetailsTabProps) => {
  // Sort vehicles by maintenance costs (highest first)
  const maintenanceRanking = [...vehicleCosts].sort((a, b) => b.maintenance - a.maintenance);
  
  // Sort vehicles by fuel costs (highest first)
  const fuelRanking = [...vehicleCosts].sort((a, b) => b.fuel - a.fuel);
  
  return (
    <TabsContent value="details" className="space-y-6">
      {/* Vehicle breakdown cards with progress bars */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Cost Details</CardTitle>
          <CardDescription>
            Detailed breakdown of costs per vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {vehicleCosts.map((vehicle) => (
              <div key={vehicle.vehicle_id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{vehicle.vehicle_name}</h3>
                  <div className="font-bold">${vehicle.total.toFixed(2)}</div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ 
                      width: `${(vehicle.total / vehicleCosts[0]?.total || 1) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <div className="text-muted-foreground">
                    Maintenance: <span className="font-medium text-foreground">${vehicle.maintenance.toFixed(2)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Fuel: <span className="font-medium text-foreground">${vehicle.fuel.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Maintenance Ranking Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Wrench className="mr-2 h-5 w-5 text-blue-500" />
            Maintenance Cost Ranking
          </CardTitle>
          <CardDescription>
            Vehicles ranked by maintenance cost (highest to lowest)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {maintenanceRanking.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Maintenance Cost</TableHead>
                  <TableHead>% of Fleet Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRanking.map((vehicle, index) => {
                  const totalMaintenance = vehicleCosts.reduce((sum, v) => sum + v.maintenance, 0);
                  const percentage = totalMaintenance > 0 
                    ? (vehicle.maintenance / totalMaintenance) * 100 
                    : 0;
                    
                  return (
                    <TableRow key={vehicle.vehicle_id} className={index === 0 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{vehicle.vehicle_name}</TableCell>
                      <TableCell>${vehicle.maintenance.toFixed(2)}</TableCell>
                      <TableCell>{percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <AlertCircle className="mr-2 h-4 w-4" />
              No maintenance data available
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Fuel Ranking Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Fuel className="mr-2 h-5 w-5 text-amber-500" />
            Fuel Consumption Ranking
          </CardTitle>
          <CardDescription>
            Vehicles ranked by fuel cost (highest to lowest)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fuelRanking.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Fuel Cost</TableHead>
                  <TableHead>% of Fleet Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelRanking.map((vehicle, index) => {
                  const totalFuel = vehicleCosts.reduce((sum, v) => sum + v.fuel, 0);
                  const percentage = totalFuel > 0 
                    ? (vehicle.fuel / totalFuel) * 100 
                    : 0;
                    
                  return (
                    <TableRow key={vehicle.vehicle_id} className={index === 0 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{vehicle.vehicle_name}</TableCell>
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
              No fuel data available
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};
