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

interface DriverStatusData {
  status: string;
  count: number;
}

interface DriverStatusChartProps {
  data?: DriverStatusData[];
}

// Mock data for fallback
const mockData: DriverStatusData[] = [
  { status: "Available", count: 12 },
  { status: "On Trip", count: 6 },
  { status: "Off Duty", count: 3 },
  { status: "Maintenance", count: 1 },
];

export function DriverStatusChart({ data = mockData }: DriverStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
