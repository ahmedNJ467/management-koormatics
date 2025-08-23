"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface FleetData {
  name: string;
  value: number;
  color: string;
}

interface FleetDistributionChartProps {
  data?: FleetData[];
}

// Mock data for fallback
const mockData: FleetData[] = [
  { name: "Sedans", value: 12, color: "#8884d8" },
  { name: "SUVs", value: 8, color: "#82ca9d" },
  { name: "Vans", value: 4, color: "#ffc658" },
  { name: "Trucks", value: 2, color: "#ff7300" },
];

export function FleetDistributionChart({
  data = mockData,
}: FleetDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
