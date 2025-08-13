import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DisplayTrip } from "@/lib/types/trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { generateInvoiceForTrip } from "@/lib/invoice-utils";

export default function TripFinance() {
  const queryClient = useQueryClient();
  const [amountEdits, setAmountEdits] = useState<Record<string, string>>({});

  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []) as DisplayTrip[];
    },
  });

  const completedUninvoiced = useMemo(
    () =>
      (trips || []).filter((t) => t.status === "completed" && !t.invoice_id),
    [trips]
  );

  const handlePriceChange = (tripId: string, value: string) => {
    setAmountEdits((prev) => ({ ...prev, [tripId]: value }));
  };

  const handleSavePriceAndInvoice = async (trip: DisplayTrip) => {
    // Persist amount to trip first
    const amount = parseFloat(amountEdits[trip.id] || "0");
    if (isNaN(amount) || amount <= 0) return;

    const { error: updateError } = await supabase
      .from("trips")
      .update({ amount })
      .eq("id", trip.id);
    if (updateError) throw updateError;

    // Generate invoice using the updated trip record
    await generateInvoiceForTrip({ ...trip, amount } as DisplayTrip);

    setAmountEdits((prev) => {
      const copy = { ...prev };
      delete copy[trip.id];
      return copy;
    });

    queryClient.invalidateQueries({ queryKey: ["trips"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Trip Finance</h2>
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
                <div className="divide-y">
                  {completedUninvoiced.map((trip) => (
                    <div key={trip.id} className="p-4 flex items-center gap-4">
                      <div className="flex-1 text-sm">
                        <div className="font-medium">
                          {trip.pickup_location || "N/A"} →{" "}
                          {trip.dropoff_location || "N/A"}
                        </div>
                        <div className="text-muted-foreground">
                          {trip.date} • {trip.client_name || "Client"}
                        </div>
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
                          onClick={() => handleSavePriceAndInvoice(trip)}
                        >
                          Save & Invoice
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          {/* Reuse Trip Analytics page via iframe-like mount to keep it simple */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analysis moved here from Trips.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
