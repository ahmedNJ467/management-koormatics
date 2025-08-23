"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MaintenanceCostData {
  month: string;
  preventive: number;
  corrective: number;
  emergency: number;
}

interface MaintenanceCostsChartProps {
  data?: MaintenanceCostData[];
}

// Mock data for fallback
const mockData: MaintenanceCostData[] = [
  { month: "Jan", preventive: 2400, corrective: 1200, emergency: 800 },
  { month: "Feb", preventive: 2200, corrective: 1500, emergency: 600 },
  { month: "Mar", preventive: 2800, corrective: 1000, emergency: 1200 },
  { month: "Apr", preventive: 2600, corrective: 1300, emergency: 900 },
  { month: "May", preventive: 2900, corrective: 1100, emergency: 700 },
  { month: "Jun", preventive: 2500, corrective: 1400, emergency: 1000 },
];

export function MaintenanceCostsChart({
  data = mockData,
}: MaintenanceCostsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Costs</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
            />
            <Bar
              dataKey="preventive"
              stackId="a"
              fill="#8884d8"
              name="Preventive"
            />
            <Bar
              dataKey="corrective"
              stackId="a"
              fill="#82ca9d"
              name="Corrective"
            />
            <Bar
              dataKey="emergency"
              stackId="a"
              fill="#ffc658"
              name="Emergency"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
