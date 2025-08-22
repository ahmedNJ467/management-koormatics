"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FuelConsumptionData {
  date: string;
  consumption: number;
  efficiency: number;
}

interface FuelConsumptionChartProps {
  data?: FuelConsumptionData[];
}

// Mock data for fallback
const mockData: FuelConsumptionData[] = [
  { date: "2024-01-01", consumption: 120, efficiency: 12.5 },
  { date: "2024-01-02", consumption: 135, efficiency: 11.8 },
  { date: "2024-01-03", consumption: 110, efficiency: 13.2 },
  { date: "2024-01-04", consumption: 145, efficiency: 11.5 },
  { date: "2024-01-05", consumption: 125, efficiency: 12.8 },
  { date: "2024-01-06", consumption: 140, efficiency: 12.0 },
  { date: "2024-01-07", consumption: 115, efficiency: 13.5 },
];

export function FuelConsumptionChart({
  data = mockData,
}: FuelConsumptionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuel Consumption Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number, name: string) => [
                name === "consumption" ? `${value}L` : `${value} km/L`,
                name === "consumption" ? "Consumption" : "Efficiency",
              ]}
            />
            <Line
              type="monotone"
              dataKey="consumption"
              stroke="#8884d8"
              strokeWidth={2}
              name="consumption"
            />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#82ca9d"
              strokeWidth={2}
              name="efficiency"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
