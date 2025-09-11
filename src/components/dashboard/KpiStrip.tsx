import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Kpi = { label: string; value: number | string; hint?: string };

const todayBounds = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
};

export default function KpiStrip() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const { start, end } = todayBounds();

      const [vehiclesCount, driversActive, tripsToday, maintenanceOpen] =
        await Promise.all([
          supabase
            .from("vehicles")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("drivers")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          supabase
            .from("trips")
            .select("id", { count: "exact", head: true })
            .gte("date", start)
            .lt("date", end),
          supabase
            .from("maintenance")
            .select("id", { count: "exact", head: true })
            .eq("status", "scheduled"),
        ]);

      const kpis: Kpi[] = [
        { label: "Vehicles", value: vehiclesCount.count ?? 0 },
        { label: "Active drivers", value: driversActive.count ?? 0 },
        { label: "Trips today", value: tripsToday.count ?? 0 },
        { label: "Scheduled maintenance", value: maintenanceOpen.count ?? 0 },
      ];
      return kpis;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-md p-3 bg-card">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {data?.map((kpi) => (
        <div key={kpi.label} className="border rounded-md p-3 bg-card">
          <div className="text-xs text-muted-foreground">{kpi.label}</div>
          <div className="text-xl font-semibold leading-tight text-foreground">
            {kpi.value}
          </div>
          {kpi.hint ? (
            <div className="mt-2 text-[10px] text-muted-foreground">
              {kpi.hint}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
