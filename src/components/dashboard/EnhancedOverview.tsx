"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Users,
  Wrench,
  Fuel,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";

interface OverviewMetric {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

interface EnhancedOverviewProps {
  metrics?: OverviewMetric[];
}

// Mock metrics for fallback
const mockMetrics: OverviewMetric[] = [
  {
    title: "Total Vehicles",
    value: 24,
    icon: <Car className="h-4 w-4" />,
    trend: { value: 2, isPositive: true },
    description: "Active fleet vehicles",
  },
  {
    title: "Active Drivers",
    value: 18,
    icon: <Users className="h-4 w-4" />,
    trend: { value: 1, isPositive: true },
    description: "Currently available",
  },
  {
    title: "Maintenance Due",
    value: 3,
    icon: <Wrench className="h-4 w-4" />,
    trend: { value: 1, isPositive: false },
    description: "Vehicles needing service",
  },
  {
    title: "Fuel Efficiency",
    value: "12.5 km/L",
    icon: <Fuel className="h-4 w-4" />,
    trend: { value: 0.5, isPositive: true },
    description: "Fleet average",
  },
];

export function EnhancedOverview({
  metrics = mockMetrics,
}: EnhancedOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>

            {metric.trend && (
              <div className="flex items-center gap-1 mt-1">
                {metric.trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-xs ${
                    metric.trend.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.trend.isPositive ? "+" : "-"}
                  {Math.abs(metric.trend.value)}
                </span>
              </div>
            )}

            {metric.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
