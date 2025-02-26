
import { Card } from "@/components/ui/card";
import { Car, Users, Wrench, Fuel, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const monthlyData = [
  { month: "Jan", vehicles: 20, maintenance: 2 },
  { month: "Feb", vehicles: 22, maintenance: 3 },
  { month: "Mar", vehicles: 21, maintenance: 2 },
  { month: "Apr", vehicles: 23, maintenance: 4 },
  { month: "May", vehicles: 24, maintenance: 3 },
  { month: "Jun", vehicles: 24, maintenance: 3 },
];

const fuelConsumptionData = [
  { month: "Jan", consumption: 2500 },
  { month: "Feb", consumption: 2300 },
  { month: "Mar", consumption: 2400 },
  { month: "Apr", consumption: 2200 },
  { month: "May", consumption: 2100 },
  { month: "Jun", consumption: 2000 },
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
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                    : stat.changeType === "negative"
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800"
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
                className={`text-sm font-medium flex items-center gap-1 ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {stat.changeType === "positive" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : stat.changeType === "negative" ? (
                  <TrendingDown className="h-4 w-4" />
                ) : null}
                {stat.change} from last month
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Fleet Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="vehicles" fill="hsl(var(--primary))" name="Total Vehicles" />
                <Bar dataKey="maintenance" fill="hsl(var(--destructive))" name="In Maintenance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Fuel Consumption Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="consumption" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Liters"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
