import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { generateInvoiceForTrip } from "@/lib/invoice-utils";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  ArrowRight,
  Calendar,
  User,
  Clock,
  Navigation,
  Shield,
  FileText,
} from "lucide-react";
import { tripTypeDisplayMap } from "@/lib/types/trip/base-types";
import { mapDatabaseFieldsToTrip } from "@/lib/types/trip";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { MonthlyTripChart } from "@/components/trip-analytics/MonthlyTripChart";
import { TopClientsChart } from "@/components/trip-analytics/TopClientsChart";
import { TripsByTypeChart } from "@/components/trip-analytics/TripsByTypeChart";
import { DriverPerformance } from "@/components/trip-analytics/DriverPerformance";

export default function TripFinance() {
  const queryClient = useQueryClient();
  const [amountEdits, setAmountEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      // Fetch completed trips OR trips with actual end/dropoff time set (union client-side)
      const baseSelect = `
        *,
        clients:client_id(name,type),
        vehicles:vehicle_id(make,model,registration),
        drivers:driver_id(name,contact,avatar_url)
      `;

      const [completed, withDropoff] = await Promise.all([
        supabase
          .from("trips")
          .select(baseSelect)
          .eq("status", "completed" as any),
        supabase
          .from("trips")
          .select(baseSelect)
          .not("actual_dropoff_time", "is", null),
      ]);

      const errors = [completed.error, withDropoff.error].filter(
        Boolean
      ) as any[];
      if (errors.length) {
        throw errors[0];
      }

      const combinedRaw = [
        ...(completed.data || []),
        ...(withDropoff.data || []),
      ];

      const combined = combinedRaw.map((t: any) =>
        mapDatabaseFieldsToTrip(t)
      ) as DisplayTrip[];

      // De-duplicate by id
      const uniqueMap = new Map<string, DisplayTrip>();
      for (const t of combined) {
        if (t && (t as any).id) uniqueMap.set((t as any).id as string, t);
      }
      const unique = Array.from(uniqueMap.values());

      // Sort by date desc
      unique.sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return db - da;
      });

      return unique;
    },
  });

  const completedUninvoiced = useMemo(() => {
    return (trips || []).filter((t) => {
      const normalizedStatus = (t.status || "").toLowerCase();
      const statusLooksCompleted =
        normalizedStatus === "completed" ||
        /status\s*:\s*completed/i.test(t.notes || "") ||
        Boolean((t as any).actual_dropoff_time || (t as any).actual_end_time);
      const uninvoiced = !t.invoice_id;
      return statusLooksCompleted && uninvoiced;
    });
  }, [trips]);

  const handlePriceChange = (tripId: string, value: string) => {
    setAmountEdits((prev) => ({ ...prev, [tripId]: value }));
  };

  const handleSavePriceAndInvoice = async (trip: DisplayTrip) => {
    const amount = parseFloat(amountEdits[trip.id] || "0");
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Enter a valid amount",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (trip.invoice_id) {
      toast({
        title: "Invoice already exists",
        description: "This trip is already linked to an invoice.",
      });
      return;
    }

    try {
      setSavingId(trip.id);
      const { error: updateError } = await supabase
        .from("trips")
        .update({ amount, status: "completed" } as any)
        .eq("id", trip.id as any);
      if (updateError) throw updateError;

      // Create invoice now that amount is set
      await generateInvoiceForTrip({ ...trip, amount } as DisplayTrip);

      setAmountEdits((prev) => {
        const copy = { ...prev };
        delete copy[trip.id];
        return copy;
      });

      toast({
        title: "Saved & Invoiced",
        description: "Amount saved and invoice created.",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      ]);
    } catch (e: any) {
      toast({
        title: "Failed to save",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Trip Finance
              </h1>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pricing" className="w-full">
          <TabsList>
            <TabsTrigger value="pricing">Trip Pricing</TabsTrigger>
            <TabsTrigger value="analysis">Trip Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : completedUninvoiced.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">
                    No completed trips pending pricing.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedUninvoiced.map((trip) => (
                      <Accordion
                        key={trip.id}
                        type="single"
                        collapsible
                        className="rounded-md border"
                      >
                        <AccordionItem value="item">
                          <AccordionTrigger className="px-4 py-3">
                            <div className="flex w-full items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="text-base font-semibold">
                                  {new Date(trip.date).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </div>
                                {trip.time && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{trip.time}</span>
                                  </div>
                                )}
                                {trip.id && (
                                  <div className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    #
                                    {String(trip.id)
                                      .substring(0, 7)
                                      .toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {(
                                  tripTypeDisplayMap[trip.type] ||
                                  trip.type ||
                                  ""
                                ).replace(/_/g, " ")}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              <div className="lg:col-span-2 text-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <Navigation className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">
                                    Route
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                      <div>
                                        <div className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">
                                          Pickup
                                        </div>
                                        <div className="text-sm font-medium">
                                          {trip.pickup_location ||
                                            "Not specified"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {Array.isArray(trip.stops) &&
                                    trip.stops.length > 0 && (
                                      <div>
                                        <div className="text-xs text-muted-foreground mb-1">
                                          Stops
                                        </div>
                                        <ul className="list-disc list-inside space-y-1">
                                          {trip.stops.map((s, i) => (
                                            <li key={i}>{s}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  <div>
                                    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                                      <div>
                                        <div className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">
                                          Dropoff
                                        </div>
                                        <div className="text-sm font-medium">
                                          {trip.dropoff_location ||
                                            "Not specified"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {trip.notes && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Notes
                                    </div>
                                    <div className="whitespace-pre-wrap">
                                      {trip.notes}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Client
                                  </div>
                                  <div className="font-medium flex items-center gap-2">
                                    <span>{trip.client_name}</span>
                                    {trip.client_type && (
                                      <Badge
                                        variant="outline"
                                        className="text-[11px] bg-slate-500/10 text-slate-700 border-slate-500/20"
                                      >
                                        {trip.client_type === "organization"
                                          ? "Organization"
                                          : "Individual"}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {trip.driver_name && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Driver
                                    </div>
                                    <div className="font-medium">
                                      {trip.driver_name}
                                    </div>
                                  </div>
                                )}
                                {!trip.driver_name && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Driver
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-amber-600"
                                    >
                                      Unassigned
                                    </Badge>
                                  </div>
                                )}
                                {trip.vehicle_details && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Vehicle
                                    </div>
                                    <div className="font-medium">
                                      {trip.vehicle_details}
                                    </div>
                                  </div>
                                )}
                                {(trip.vehicle_type ||
                                  trip.soft_skin_count ||
                                  trip.armoured_count) && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Vehicle Type
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      {trip.vehicle_type && (
                                        <Badge
                                          variant="outline"
                                          className="text-[11px]"
                                        >
                                          {trip.vehicle_type === "armoured"
                                            ? "Armoured"
                                            : "Soft Skin"}
                                        </Badge>
                                      )}
                                      {typeof trip.soft_skin_count ===
                                        "number" &&
                                        trip.soft_skin_count > 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-[11px]"
                                          >
                                            Soft Skin: {trip.soft_skin_count}
                                          </Badge>
                                        )}
                                      {typeof trip.armoured_count ===
                                        "number" &&
                                        trip.armoured_count > 0 && (
                                          <Badge
                                            variant="outline"
                                            className="text-[11px]"
                                          >
                                            Armoured: {trip.armoured_count}
                                          </Badge>
                                        )}
                                    </div>
                                  </div>
                                )}
                                {trip.has_security_escort && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Shield className="h-4 w-4 text-rose-500" />
                                      <span className="text-sm font-medium text-rose-600">
                                        Security Escort
                                      </span>
                                    </div>
                                    <div className="text-xs inline-flex items-center px-2 py-1 rounded border bg-rose-500/10 text-rose-700 border-rose-500/20">
                                      {trip.escort_count || 1} escort vehicle(s)
                                      required
                                    </div>
                                  </div>
                                )}
                                {(trip.airline ||
                                  trip.flight_number ||
                                  trip.terminal) && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Flight
                                    </div>
                                    <div className="text-sm">
                                      {[
                                        trip.airline,
                                        trip.flight_number,
                                        trip.terminal,
                                      ]
                                        .filter(Boolean)
                                        .join(" / ")}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t flex-wrap gap-3">
                              <div>
                                <Badge
                                  variant="outline"
                                  className="bg-green-500/10 text-green-700 border-green-500/20 text-[11px]"
                                >
                                  COMPLETED
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="Amount"
                                  className="w-32"
                                  value={amountEdits[trip.id] || ""}
                                  onChange={(e) =>
                                    handlePriceChange(trip.id, e.target.value)
                                  }
                                  min="0"
                                  step="0.01"
                                />
                                <Button
                                  variant="outline"
                                  disabled={savingId === trip.id}
                                  onClick={() =>
                                    handleSavePriceAndInvoice(trip)
                                  }
                                >
                                  {savingId === trip.id
                                    ? "Saving..."
                                    : "Save & Invoice"}
                                </Button>
                                {trip.log_sheet_url && (
                                  <Button asChild variant="outline">
                                    <a
                                      href={trip.log_sheet_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Log Sheet
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-sm text-muted-foreground">
                    Loading analytics...
                  </div>
                </div>
              ) : trips && trips.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Trip Trends */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Monthly Trip Trends
                      </h3>
                      <MonthlyTripChart trips={trips} />
                    </CardContent>
                  </Card>

                  {/* Top Clients */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Top Clients by Trip Volume
                      </h3>
                      <TopClientsChart trips={trips} />
                    </CardContent>
                  </Card>

                  {/* Trips by Type */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Trips by Type
                      </h3>
                      <TripsByTypeChart trips={trips} />
                    </CardContent>
                  </Card>

                  {/* Driver Performance */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Driver Performance
                      </h3>
                      <DriverPerformance trips={trips} />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      No trip data available
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Complete some trips to see analytics
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
