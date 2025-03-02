
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DisplayInvoice, InvoiceItem, Json } from "@/lib/types/invoice";
import { DisplayTrip } from "@/lib/types/trip";
import { useEffect } from "react";

export function useInvoicesQuery() {
  const queryClient = useQueryClient();

  // Setup real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("invoices-changes")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "invoices" }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          clients:client_id(name, email, address, phone),
          trips:invoice_id(*)
        `)
        .order("date", { ascending: false });

      if (error) throw error;

      // Use a more direct approach to avoid deep type nesting
      return data.map((invoice: any) => {
        // Convert trip data to proper DisplayTrip objects
        let tripsForInvoice: DisplayTrip[] = [];
        
        if (invoice.trips && Array.isArray(invoice.trips)) {
          tripsForInvoice = invoice.trips.map((trip: any) => ({
            ...trip,
            type: trip.type || trip.service_type || 'other',
            status: trip.status || 'scheduled',
            client_name: invoice.clients?.name || "Unknown Client",
            vehicle_details: "Vehicle details not available",
            driver_name: "Driver not assigned",
          }));
        }
        
        // Parse items from JSON to ensure correct typing
        let parsedItems: InvoiceItem[] = [];
        
        if (invoice.items) {
          try {
            if (typeof invoice.items === 'string') {
              parsedItems = JSON.parse(invoice.items);
            } else {
              parsedItems = invoice.items as InvoiceItem[];
            }
          } catch (e) {
            console.error("Error parsing invoice items:", e);
          }
        }

        // Create the display invoice object directly
        const displayInvoice: DisplayInvoice = {
          id: invoice.id,
          client_id: invoice.client_id,
          date: invoice.date,
          due_date: invoice.due_date,
          status: invoice.status,
          items: parsedItems,
          total_amount: invoice.total_amount,
          paid_amount: invoice.paid_amount || 0,
          payment_date: invoice.payment_date,
          payment_method: invoice.payment_method,
          quotation_id: invoice.quotation_id,
          notes: invoice.notes,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at,
          client_name: invoice.clients?.name || "Unknown Client",
          client_email: invoice.clients?.email || "",
          client_address: invoice.clients?.address || "",
          client_phone: invoice.clients?.phone || "",
          trips: tripsForInvoice,
          quotation_number: invoice.quotation_id?.substring(0, 8).toUpperCase(),
        };
        
        return displayInvoice;
      });
    },
  });
}

export function useAvailableTripsQuery(clientId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["availableTrips", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email, address, phone),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .eq("client_id", clientId)
        .is("invoice_id", null)
        .in("status", ["completed", "in_progress"])
        .order("date", { ascending: false });

      if (error) throw error;

      // Use a more direct approach to avoid deep type instantiation
      return data.map((trip: any) => {
        const displayTrip: DisplayTrip = {
          id: trip.id,
          client_id: trip.client_id,
          vehicle_id: trip.vehicle_id,
          driver_id: trip.driver_id,
          date: trip.date,
          start_time: trip.start_time || trip.time,
          end_time: trip.end_time || trip.return_time,
          type: trip.type || trip.service_type || 'other',
          status: trip.status || 'scheduled',
          amount: trip.amount || 0,
          pickup_location: trip.pickup_location,
          dropoff_location: trip.dropoff_location,
          notes: trip.notes || trip.special_instructions,
          invoice_id: trip.invoice_id,
          created_at: trip.created_at,
          updated_at: trip.updated_at,
          client_name: trip.clients?.name || "Unknown Client",
          vehicle_details: `${trip.vehicles?.make || ""} ${trip.vehicles?.model || ""} (${trip.vehicles?.registration || ""})`,
          driver_name: trip.drivers?.name || "Unknown Driver",
          driver_avatar: trip.drivers?.avatar_url,
          driver_contact: trip.drivers?.contact,
        };
        
        return displayTrip;
      });
    },
    enabled: !!clientId && enabled,
  });
}
