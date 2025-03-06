
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTripsData } from "@/hooks/use-trips-data";
import { TripsOverviewTab } from "@/components/trip-analytics/TripsOverviewTab";
import { TripsDistributionTab } from "@/components/trip-analytics/TripsDistributionTab";
import { TripsTrendsTab } from "@/components/trip-analytics/TripsTrendsTab";
import { TripsRevenueTab } from "@/components/trip-analytics/TripsRevenueTab";
import { TripsDashboardLoading } from "@/components/trip-analytics/TripsDashboardLoading";

export default function TripAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const { trips, isLoading } = useTripsData();

  // Pre-load all tabs data to ensure smooth tab switching
  useEffect(() => {
    if (trips) {
      console.log(`Loaded ${trips.length} trips for analytics`);
    }
  }, [trips]);

  if (isLoading) {
    return <TripsDashboardLoading />;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Trip Analytics</h1>
        <p className="text-muted-foreground">
          Analyze and visualize your transportation service data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Trip Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <TripsOverviewTab trips={trips} />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <TripsDistributionTab trips={trips} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <TripsTrendsTab trips={trips} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <TripsRevenueTab trips={trips} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
