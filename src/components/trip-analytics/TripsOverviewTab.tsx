
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { calculateTripMetrics } from "./utils/trip-calculations";
import { TripsSummaryCards } from "./TripsSummaryCards";
import { DisplayTrip } from "@/lib/types/trip";
import { COLORS } from "@/lib/types/cost-analytics";

interface TripsOverviewTabProps {
  trips: DisplayTrip[] | undefined;
}

export function TripsOverviewTab({ trips = [] }: TripsOverviewTabProps) {
  const metrics = useMemo(() => calculateTripMetrics(trips), [trips]);
  
  // Monthly trip count data
  const monthlyData = metrics.monthlyTripCounts.map(item => ({
    name: item.month,
    value: item.count
  }));

  // Trip type distribution
  const typeData = metrics.tripTypeDistribution;

  return (
    <div className="space-y-6">
      <TripsSummaryCards metrics={metrics} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trip Volume</CardTitle>
            <CardDescription>Number of trips per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`${value} trips`, 'Volume']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trip Type Distribution</CardTitle>
            <CardDescription>Breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => [`${value} trips`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
