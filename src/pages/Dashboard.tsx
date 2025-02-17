
import { Card } from "@/components/ui/card";
import { Car, Users, Wrench, Fuel } from "lucide-react";

const stats = [
  {
    name: "Total Vehicles",
    value: "24",
    icon: Car,
    change: "+2.5%",
    changeType: "positive",
  },
  {
    name: "Active Drivers",
    value: "18",
    icon: Users,
    change: "0%",
    changeType: "neutral",
  },
  {
    name: "Maintenance Due",
    value: "3",
    icon: Wrench,
    change: "-1",
    changeType: "negative",
  },
  {
    name: "Fuel Efficiency",
    value: "92%",
    icon: Fuel,
    change: "+4.3%",
    changeType: "positive",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your fleet management statistics
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`rounded-lg p-2 ${
                  stat.changeType === "positive"
                    ? "bg-green-100 text-green-600"
                    : stat.changeType === "negative"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <h3 className="text-2xl font-semibold">{stat.value}</h3>
              </div>
            </div>
            <div className="mt-4">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {stat.change} from last month
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
