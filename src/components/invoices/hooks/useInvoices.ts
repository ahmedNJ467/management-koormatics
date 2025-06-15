
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DisplayInvoice, convertToInvoice } from "@/lib/types/invoice";
import { DisplayTrip } from "@/lib/types/trip";
import { Client } from "@/lib/types/client";
import { isInvoiceOverdue } from "@/lib/invoice-helpers";

export function useInvoices() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`*, clients:client_id(name, email, address, phone)`)
        .order("date", { ascending: false });

      if (invoicesError) throw invoicesError;

      const invoicesWithTrips = await Promise.all(
        invoicesData.map(async (invoice) => {
          const { data: tripsData } = await supabase.from("trips").select(`*`).eq("invoice_id", invoice.id);
          const tripsForInvoice = tripsData ? tripsData.map((trip: any) => ({ ...trip, type: trip.service_type || 'other', status: 'scheduled', client_name: invoice.clients?.name || "Unknown Client" } as DisplayTrip)) : [];
          const displayInvoice = convertToInvoice(invoice);
          displayInvoice.trips = tripsForInvoice;
          return displayInvoice;
        })
      );
      return invoicesWithTrips;
    },
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, email, address, phone").order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("invoices-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
  
  useEffect(() => {
    const updateOverdueInvoices = async () => {
      if (!invoices) return;
      const overdueInvoices = invoices.filter(isInvoiceOverdue);
      if (overdueInvoices.length > 0) {
        await Promise.all(overdueInvoices.map(invoice =>
          supabase.from("invoices").update({ status: "overdue" }).eq("id", invoice.id)
        ));
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      }
    };
    updateOverdueInvoices();
  }, [invoices, queryClient]);

  const filteredInvoices = useMemo(() => {
    return invoices?.filter(invoice => {
      const matchesSearch = searchTerm === "" ||
        invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.substring(0, 8).toUpperCase().includes(searchTerm.toUpperCase());
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  return {
    invoices,
    clients,
    filteredInvoices,
    isLoading: invoicesLoading || clientsLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
  };
}
