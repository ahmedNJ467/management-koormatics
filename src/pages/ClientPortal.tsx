
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Star, Plus, History, FileText, Navigation } from "lucide-react";
import { ClientBookingForm } from "@/components/client-portal/ClientBookingForm";
import { TripHistory } from "@/components/client-portal/TripHistory";
import { InvoiceAccess } from "@/components/client-portal/InvoiceAccess";
import { TripTracking } from "@/components/client-portal/TripTracking";
import { FeedbackForm } from "@/components/client-portal/FeedbackForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ClientPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Mock client user ID - in real implementation this would come from authentication
  const clientUserId = "mock-client-user-id";

  const { data: clientBookings, isLoading } = useQuery({
    queryKey: ["client-bookings", clientUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_bookings")
        .select("*")
        .eq("client_user_id", clientUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: activeTrips } = useQuery({
    queryKey: ["active-trips", clientUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_bookings")
        .select(`
          *,
          trips:trip_id (
            id,
            status,
            date,
            time,
            pickup_location,
            dropoff_location
          )
        `)
        .eq("client_user_id", clientUserId)
        .in("status", ["confirmed", "in_progress"])
        .order("pickup_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const pendingBookings = clientBookings?.filter(booking => booking.status === "pending") || [];
  const completedTrips = clientBookings?.filter(booking => booking.status === "completed") || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Client Portal</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your bookings and trips</p>
            </div>
            <Button onClick={() => setShowBookingForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="bookings">Book Trip</TabsTrigger>
            <TabsTrigger value="history">Trip History</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingBookings.length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeTrips?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently in progress</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Trips</CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedTrips.length}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs text-muted-foreground">Based on recent trips</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Your latest trip requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : pendingBookings.length > 0 ? (
                    pendingBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{booking.pickup_location} → {booking.dropoff_location}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {booking.pickup_date}
                            {booking.pickup_time && (
                              <>
                                <Clock className="h-3 w-3 ml-2" />
                                {booking.pickup_time}
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">{booking.status}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No pending bookings</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Trips</CardTitle>
                  <CardDescription>Currently in progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeTrips && activeTrips.length > 0 ? (
                    activeTrips.slice(0, 3).map((trip: any) => (
                      <div key={trip.id} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{trip.pickup_location} → {trip.dropoff_location}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            En route
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setActiveTab("tracking")}>
                          Track
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No active trips</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <ClientBookingForm onSuccess={() => setActiveTab("dashboard")} />
          </TabsContent>

          <TabsContent value="history">
            <TripHistory clientUserId={clientUserId} />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoiceAccess clientUserId={clientUserId} />
          </TabsContent>

          <TabsContent value="tracking">
            <TripTracking clientUserId={clientUserId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">New Booking</h2>
                <Button variant="ghost" onClick={() => setShowBookingForm(false)}>×</Button>
              </div>
              <ClientBookingForm 
                onSuccess={() => {
                  setShowBookingForm(false);
                  setActiveTab("dashboard");
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
