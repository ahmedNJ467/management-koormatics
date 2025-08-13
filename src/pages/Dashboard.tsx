import { useState, useEffect } from "react";
import { EnhancedOverview } from "@/components/dashboard/EnhancedOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import KpiStrip from "@/components/dashboard/KpiStrip";
import RecentTrips from "@/components/dashboard/RecentTrips";
import { useQueryClient } from "@tanstack/react-query";
import { useTenantScope } from "@/hooks/use-tenant-scope";
import { supabase } from "@/integrations/supabase/client";
import { ActivityItemProps } from "@/types/dashboard";
// Intentionally minimal: no decorative icons to keep layout compact
import { getActivities, logTripActivity } from "@/utils/activity-logger";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { domain } = useTenantScope();
  const [recentActivities, setRecentActivities] = useState<ActivityItemProps[]>(
    []
  );

  useEffect(() => {
    const loadActivities = async () => {
      const activities = await getActivities(5);
      setRecentActivities(activities);
    };

    loadActivities();

    // Refresh activities every 30 seconds instead of 15 to reduce load
    const intervalId = setInterval(async () => {
      const activities = await getActivities(5);
      setRecentActivities(activities);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Create a single channel for all fleet data changes
    const fleetChannel = supabase
      .channel("fleet-data-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
        },
        async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
          const activities = await getActivities(5);
          setRecentActivities(activities);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drivers",
        },
        async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
          const activities = await getActivities(5);
          setRecentActivities(activities);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "maintenance",
        },
        async () => {
          queryClient.invalidateQueries({ queryKey: ["fleet-stats"] });
          const activities = await getActivities(5);
          setRecentActivities(activities);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
        },
        async () => {
          queryClient.invalidateQueries({ queryKey: ["contract-stats"] });
          const activities = await getActivities(5);
          setRecentActivities(activities);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trips",
        },
        async (payload) => {
          queryClient.invalidateQueries({ queryKey: ["contract-stats"] });

          // Log enhanced trip activity with proper details
          if (
            payload.new &&
            payload.eventType &&
            typeof payload.new === "object" &&
            "id" in payload.new
          ) {
            const tripId = payload.new.id;
            let action = "";

            switch (payload.eventType) {
              case "INSERT":
                action = "created";
                break;
              case "UPDATE":
                action = "updated";
                break;
              case "DELETE":
                action = "deleted";
                break;
            }

            if (action && tripId) {
              await logTripActivity(action, tripId, payload.new);
            }
          }

          const activities = await getActivities(5);
          setRecentActivities(activities);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Dashboard realtime subscribed successfully");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Dashboard realtime subscription error");
        } else if (status === "CLOSED") {
          console.log("Dashboard realtime subscription closed");
        }
      });

    return () => {
      console.log("Cleaning up dashboard realtime subscription");
      supabase.removeChannel(fleetChannel);
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {domain === "operations"
                ? "Operations Dashboard"
                : domain === "finance"
                ? "Finance Dashboard"
                : domain === "management"
                ? "Management Dashboard"
                : "Fleet Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {domain === "operations"
                ? "Operational overview and dispatch status"
                : domain === "finance"
                ? "Financial performance and documents"
                : domain === "management"
                ? "Organization-wide metrics and access"
                : "Live insights and operations"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs px-2 py-1 rounded border bg-muted/40">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Online</span>
          </div>
        </div>

        {/* KPI strip — show only for Fleet and Management */}
        {(domain === "fleet" || domain === "management") && <KpiStrip />}

        {/* Main grid without cards */}
        <div className="grid gap-3 lg:grid-cols-12">
          {/* Left column varies by domain */}
          <section className="lg:col-span-8 space-y-3">
            {domain === "operations" ? (
              <>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-medium">Dispatch & trips</h2>
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
                <div className="border rounded-md p-3 bg-card">
                  <EnhancedOverview />
                </div>
                <div className="space-y-2">
                  <h2 className="text-base font-medium">Upcoming trips</h2>
                  <RecentTrips />
                </div>
              </>
            ) : domain === "finance" ? (
              <>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-medium">Financial overview</h2>
                  <span className="text-xs text-muted-foreground">Latest</span>
                </div>
                <div className="border rounded-md p-3 bg-card">
                  <EnhancedOverview />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-medium">Fleet analytics</h2>
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
                <div className="border rounded-md p-3 bg-card">
                  <EnhancedOverview />
                </div>
                <div className="space-y-2">
                  <h2 className="text-base font-medium">Recent trips</h2>
                  <RecentTrips />
                </div>
              </>
            )}
          </section>

          {/* Right column stays consistent */}
          <aside className="lg:col-span-4 space-y-3">
            <h2 className="text-base font-medium">Recent activity</h2>
            <div className="border rounded-md p-3 bg-card">
              <RecentActivity activities={recentActivities} isLoading={false} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
