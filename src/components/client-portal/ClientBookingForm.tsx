
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClientBookingFormProps {
  onSuccess: () => void;
}

export function ClientBookingForm({ onSuccess }: ClientBookingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    service_type: "",
    pickup_location: "",
    dropoff_location: "",
    pickup_date: "",
    pickup_time: "",
    return_date: "",
    return_time: "",
    passengers: 1,
    special_requests: "",
  });

  const serviceTypes = [
    { value: "airport_transfer", label: "Airport Transfer" },
    { value: "city_transfer", label: "City Transfer" },
    { value: "hourly_rental", label: "Hourly Rental" },
    { value: "corporate_travel", label: "Corporate Travel" },
    { value: "special_event", label: "Special Event" },
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateEstimatedCost = () => {
    const baseCost = 50;
    const serviceMultipliers = {
      airport_transfer: 1.2,
      city_transfer: 1.0,
      hourly_rental: 1.5,
      corporate_travel: 1.3,
      special_event: 1.4,
    };
    
    const serviceMultiplier = serviceMultipliers[formData.service_type as keyof typeof serviceMultipliers] || 1.0;
    return Math.round(baseCost * serviceMultiplier * formData.passengers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_type || !formData.pickup_location || !formData.dropoff_location || !formData.pickup_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const estimated_cost = calculateEstimatedCost();
      
      // Get the first available client as a demo
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .limit(1);

      const clientId = clients?.[0]?.id;
      
      const { data, error } = await supabase
        .from("client_bookings")
        .insert({
          client_id: clientId,
          ...formData,
          estimated_cost,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Booking Submitted",
        description: "Your booking request has been submitted and is pending confirmation.",
      });

      // Reset form
      setFormData({
        service_type: "",
        pickup_location: "",
        dropoff_location: "",
        pickup_date: "",
        pickup_time: "",
        return_date: "",
        return_time: "",
        passengers: 1,
        special_requests: "",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Booking submission error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to submit booking request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Book a Trip
        </CardTitle>
        <CardDescription>
          Fill out the details below to request a new trip booking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type *</Label>
              <Select value={formData.service_type} onValueChange={(value) => handleInputChange("service_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passengers">Number of Passengers</Label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.passengers}
                  onChange={(e) => handleInputChange("passengers", parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickup_location">Pickup Location *</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter pickup address"
                  value={formData.pickup_location}
                  onChange={(e) => handleInputChange("pickup_location", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropoff_location">Drop-off Location *</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter destination address"
                  value={formData.dropoff_location}
                  onChange={(e) => handleInputChange("dropoff_location", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickup_date">Pickup Date *</Label>
              <Input
                type="date"
                value={formData.pickup_date}
                onChange={(e) => handleInputChange("pickup_date", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup_time">Pickup Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={formData.pickup_time}
                  onChange={(e) => handleInputChange("pickup_time", e.target.value)}
                />
              </div>
            </div>
          </div>

          {formData.service_type === "hourly_rental" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="return_date">Return Date</Label>
                <Input
                  type="date"
                  value={formData.return_date}
                  onChange={(e) => handleInputChange("return_date", e.target.value)}
                  min={formData.pickup_date}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_time">Return Time</Label>
                <Input
                  type="time"
                  value={formData.return_time}
                  onChange={(e) => handleInputChange("return_time", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="special_requests">Special Requests</Label>
            <Textarea
              placeholder="Any special requirements or notes for your trip..."
              value={formData.special_requests}
              onChange={(e) => handleInputChange("special_requests", e.target.value)}
              rows={3}
            />
          </div>

          {formData.service_type && formData.pickup_location && formData.dropoff_location && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Estimated Cost:</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  ${calculateEstimatedCost()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Final cost will be confirmed after review
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Booking Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
