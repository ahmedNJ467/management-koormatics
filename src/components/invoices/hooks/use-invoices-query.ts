import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DisplayInvoice, InvoiceItem, convertToInvoice } from "@/lib/types/invoice";
import { DisplayTrip } from "@/lib/types/trip";

export const useInvoicesQuery = () => {
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

      return data.map((invoice: any) => {
        // Convert trip data to proper DisplayTrip objects
        let tripsForInvoice: DisplayTrip[] = [];
        if (invoice.trips && Array.isArray(invoice.trips)) {
          tripsForInvoice = invoice.trips.map((trip: any) => ({
            ...trip,
            // Make sure required fields are set
            type: trip.type || trip.service_type || 'other',
            status: trip.status || 'scheduled',
            client_name: invoice.clients?.name || "Unknown Client",
            vehicle_details: "Vehicle details not available",
            driver_name: "Driver not assigned",
          } as DisplayTrip));
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
            parsedItems = [];
          }
        }
        
        return {
          ...invoice,
          items: parsedItems,
          // Add properly typed trips array
          trips: tripsForInvoice,
          // Other fields
          client_name: invoice.clients?.name || "Unknown Client",
          client_email: invoice.clients?.email || "",
          client_address: invoice.clients?.address || "",
          client_phone: invoice.clients?.phone || "",
        } as DisplayInvoice;
      });
    },
  });
};

export const useAvailableTripsQuery = (selectedClientId: string) => {
  return useQuery({
    queryKey: ["availableTrips", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];

      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          clients:client_id(name, email, address, phone),
          vehicles:vehicle_id(make, model, registration),
          drivers:driver_id(name, contact, avatar_url)
        `)
        .eq("client_id", selectedClientId)
        .is("invoice_id", null)
        .in("status", ["completed", "in_progress"])
        .order("date", { ascending: false });

      if (error) throw error;

      return data.map((trip: any) => ({
        ...trip,
        type: trip.type || trip.service_type || 'other',
        status: trip.status || 'scheduled',
        client_name: trip.clients?.name || "Unknown Client",
        vehicle_details: `${trip.vehicles?.make || ""} ${trip.vehicles?.model || ""} (${trip.vehicles?.registration || ""})`,
        driver_name: trip.drivers?.name || "Unknown Driver",
      } as DisplayTrip));
    },
    enabled: !!selectedClientId,
  });
};
