
import { useEffect } from "react";
import { useTripsData } from "@/hooks/use-trips-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TripHeader } from "@/components/trips/TripHeader";
import { TripSummaryCards } from "@/components/trip-analytics/TripSummaryCards";
import { TripsByStatusChart } from "@/components/trip-analytics/TripsByStatusChart";
import { TripsByTypeChart } from "@/components/trip-analytics/TripsByTypeChart";
import { MonthlyTripChart } from "@/components/trip-analytics/MonthlyTripChart";
import { DriverPerformance } from "@/components/trip-analytics/DriverPerformance";
import { PopularRoutes } from "@/components/trip-analytics/PopularRoutes";
import { toast } from "@/components/ui/use-toast";

export default function TripAnalytics() {
  const { trips, isLoading } = useTripsData();
  
  useEffect(() => {
    if (trips) {
      console.log("Trip data loaded for analytics:", trips.length);
    }
  }, [trips]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <TripHeader 
          calendarView={false} 
          setCalendarView={() => {}} 
          setBookingOpen={() => {}}
          isAnalyticsView={true}
        />
        <p className="text-muted-foreground">Loading trip data...</p>
      </div>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="space-y-8">
        <TripHeader 
          calendarView={false} 
          setCalendarView={() => {}} 
          setBookingOpen={() => {}}
          isAnalyticsView={true}
        />
        <p className="text-muted-foreground">No trip data available for analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TripHeader 
        calendarView={false} 
        setCalendarView={() => {}} 
        setBookingOpen={() => {}}
        isAnalyticsView={true}
      />

      <TripSummaryCards trips={trips} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
          <TabsTrigger value="drivers">Driver Performance</TabsTrigger>
          <TabsTrigger value="routes">Popular Routes</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Trips by Status</CardTitle>
                <CardDescription>Distribution of trips by their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <TripsByStatusChart trips={trips} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Trips by Type</CardTitle>
                <CardDescription>Distribution of trips by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <TripsByTypeChart trips={trips} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trip Trends</CardTitle>
              <CardDescription>Trip volume and revenue by month</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyTripChart trips={trips} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="drivers" className="pt-4">
          <DriverPerformance trips={trips} />
        </TabsContent>
        
        <TabsContent value="routes" className="pt-4">
          <PopularRoutes trips={trips} />
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analysis</CardTitle>
              <CardDescription>Revenue breakdown by trip type and client</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Revenue analysis will be available in the next update</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
