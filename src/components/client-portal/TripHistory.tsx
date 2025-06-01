
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, Star, FileText, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackForm } from "./FeedbackForm";

interface TripHistoryProps {
  clientUserId: string;
}

export function TripHistory({ clientUserId }: TripHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  const { data: tripHistory, isLoading } = useQuery({
    queryKey: ["trip-history", clientUserId],
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
            dropoff_location,
            driver_id,
            vehicle_id
          ),
          trip_feedback (
            id,
            rating,
            comments
          )
        `)
        .eq("client_user_id", clientUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredHistory = tripHistory?.filter(trip => {
    const matchesSearch = trip.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.dropoff_location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "confirmed": return "secondary";
      case "pending": return "outline";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">Loading trip history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trip History
          </CardTitle>
          <CardDescription>
            View and manage your previous bookings and trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trip List */}
          <div className="space-y-4">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((trip: any) => (
                <div key={trip.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {trip.pickup_location} → {trip.dropoff_location}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {trip.pickup_date}
                        </div>
                        {trip.pickup_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {trip.pickup_time}
                          </div>
                        )}
                        <div>Service: {trip.service_type.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={getStatusColor(trip.status)}>
                        {trip.status}
                      </Badge>
                      {trip.confirmed_cost && (
                        <div className="text-lg font-semibold">
                          ${trip.confirmed_cost}
                        </div>
                      )}
                    </div>
                  </div>

                  {trip.special_requests && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Special Requests:</strong> {trip.special_requests}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex gap-2">
                      {trip.status === "completed" && !trip.trip_feedback?.length && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowFeedback(trip.id)}
                          className="flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" />
                          Rate Trip
                        </Button>
                      )}
                      {trip.trip_feedback?.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          Rated {trip.trip_feedback[0].rating}/5
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Booked on {new Date(trip.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "No trips match your search criteria" 
                  : "No trip history found"
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Rate Your Trip</h3>
                <Button variant="ghost" onClick={() => setShowFeedback(null)}>×</Button>
              </div>
              <FeedbackForm
                tripId={showFeedback}
                clientUserId={clientUserId}
                onSuccess={() => setShowFeedback(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
