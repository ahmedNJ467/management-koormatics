import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { PieChart, Pie, Cell } from "recharts";
import { CategoryData, COLORS } from "@/lib/types/cost-analytics";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CategoriesTabProps {
  maintenanceCategories: CategoryData[];
  fuelTypes: CategoryData[];
}

const buildChartData = (data: CategoryData[]) =>
  data.map((entry, index) => ({
    ...entry,
    fill: COLORS[index % COLORS.length],
  }));

const buildChartConfig = (data: ReturnType<typeof buildChartData>, label: string) =>
  data.reduce<ChartConfig>(
    (acc, entry) => {
      acc[entry.name] = {
        label: entry.name,
        color: entry.fill,
      };
      return acc;
    },
    {
      value: {
        label,
      },
    } as ChartConfig
  );

export const CategoriesTab = ({ maintenanceCategories, fuelTypes }: CategoriesTabProps) => {
  const maintenanceChartData = buildChartData(maintenanceCategories);
  const fuelChartData = buildChartData(fuelTypes);

  const maintenanceChartConfig = buildChartConfig(maintenanceChartData, "Maintenance");
  const fuelChartConfig = buildChartConfig(fuelChartData, "Fuel");

  return (
    <TabsContent value="categories" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Categories</CardTitle>
            <CardDescription>
              Cost breakdown by maintenance type
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] w-full">
            {maintenanceChartData.length > 0 ? (
              <ChartContainer
                config={maintenanceChartConfig}
                className="mx-auto aspect-square max-h-[320px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(value) =>
                          typeof value === "number"
                            ? `$${value.toFixed(2)}`
                            : value ?? ""
                        }
                      />
                    }
                  />
                  <Pie
                    data={maintenanceChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={110}
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {maintenanceChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No maintenance category data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Type Distribution</CardTitle>
            <CardDescription>
              Cost breakdown by fuel type
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] w-full">
            {fuelChartData.length > 0 ? (
              <ChartContainer
                config={fuelChartConfig}
                className="mx-auto aspect-square max-h-[320px] w-full"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(value) =>
                          typeof value === "number"
                            ? `$${value.toFixed(2)}`
                            : value ?? ""
                        }
                      />
                    }
                  />
                  <Pie
                    data={fuelChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={110}
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {fuelChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No fuel type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};
