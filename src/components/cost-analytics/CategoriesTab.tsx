import { TabsContent } from "@/components/ui/tabs";
import { CategoryData, COLORS } from "@/lib/types/cost-analytics";
import { PieLegendCard } from "@/components/charts/PieLegendCard";
import { ChartConfig } from "@/components/ui/chart";

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
        <PieLegendCard
          title="Maintenance Categories"
          description="Cost breakdown by maintenance type"
          data={maintenanceChartData}
          config={maintenanceChartConfig}
          emptyMessage="No maintenance category data available"
        />

        <PieLegendCard
          title="Fuel Type Distribution"
          description="Cost breakdown by fuel type"
          data={fuelChartData}
          config={fuelChartConfig}
          emptyMessage="No fuel type data available"
        />
      </div>
    </TabsContent>
  );
};
