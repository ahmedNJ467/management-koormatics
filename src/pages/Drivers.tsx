
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

const drivers = [
  {
    id: "D001",
    name: "John Smith",
    contact: "+254 712 345 678",
    license: "DL123456",
    licenseType: "Class A",
    licenseExpiry: "2024-12-31",
    status: "Active",
  },
  {
    id: "D002",
    name: "Jane Doe",
    contact: "+254 723 456 789",
    license: "DL234567",
    licenseType: "Class B",
    licenseExpiry: "2024-10-15",
    status: "On Leave",
  },
];

export default function Drivers() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Drivers</h2>
          <p className="text-muted-foreground">Manage your fleet drivers</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Driver
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {drivers.map((driver) => (
          <Card key={driver.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-secondary">
                    {driver.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{driver.name}</h3>
                  <p className="text-sm text-muted-foreground">{driver.contact}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">License:</span>
                  <span>{driver.license}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{driver.licenseType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expiry:</span>
                  <span>{driver.licenseExpiry}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={driver.status === "Active" ? "text-green-600" : "text-yellow-600"}>
                    {driver.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
