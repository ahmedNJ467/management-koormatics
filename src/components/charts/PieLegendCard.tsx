"use client";

import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface PieLegendCardProps {
  title: string;
  description?: string;
  data: { [key: string]: any }[];
  config: ChartConfig;
  valueKey?: string;
  nameKey?: string;
  emptyMessage?: string;
  chartClassName?: string;
}

export function PieLegendCard({
  title,
  description,
  data,
  config,
  valueKey = "value",
  nameKey = "name",
  emptyMessage = "No data available",
  chartClassName,
}: PieLegendCardProps) {
  const hasData = data && data.length > 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {hasData ? (
          <ChartContainer
            config={config}
            className={cn("mx-auto aspect-square max-h-[300px]", chartClassName)}
          >
            <PieChart>
              <Pie data={data} dataKey={valueKey} nameKey={nameKey} />
              <ChartLegend
                content={<ChartLegendContent nameKey={nameKey} />}
                className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PieLegendCard;

