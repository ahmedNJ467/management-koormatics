import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { VehicleCostData } from "@/lib/types/cost-analytics";

interface DetailsTabProps {
  vehicleCosts: VehicleCostData[];
}

export const DetailsTab = ({ vehicleCosts }: DetailsTabProps) => {
  return (
    <TabsContent value="details" className="space-y-4">
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
    </TabsContent>
  );
};
