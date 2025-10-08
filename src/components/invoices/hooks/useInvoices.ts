import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DisplayInvoice, convertToInvoice } from "@/lib/types/invoice";
import { DisplayTrip } from "@/lib/types/trip";
import { Client } from "@/lib/types/client";
import { isInvoiceOverdue, formatDate } from "@/lib/invoice-helpers";

export function useInvoices() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices, isLoading: invoicesLoading } = useQuery<
    DisplayInvoice[]
  >({
    queryKey: ["invoices"],
    queryFn: async () => {
      // Fetch regular invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`*, clients:client_id(name, email, address, phone)`)
        .order("date", { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch lease invoices with lease details
      const { data: leaseInvoicesData, error: leaseInvoicesError } = await (
        supabase as any
      )
        .from("lease_invoice_details" as any)
        .select("*")
        .order("invoice_date", { ascending: false });

      if (leaseInvoicesError) throw leaseInvoicesError;

      // Process regular invoices
      const regularInvoices = (await Promise.all(
        (invoicesData || []).map(async (invoice) => {
          if (!invoice || !("id" in invoice)) return null;
          const { data: tripsData } = await supabase
            .from("trips")
            .select(`*`)
            .eq("invoice_id", invoice.id as any);
          const tripsForInvoice = tripsData
            ? tripsData.map(
                (trip: any) =>
                  ({
                    ...trip,
                    type: trip.service_type || "other",
                    status: "scheduled",
                    client_name:
                      (invoice as any).clients?.name || "Unknown Client",
                  } as DisplayTrip)
              )
            : [];
          const displayInvoice = convertToInvoice(invoice);
          displayInvoice.trips = tripsForInvoice;
          return displayInvoice;
        })
      )) as (DisplayInvoice | null)[];

      // Process lease invoices
      const leaseInvoices = (leaseInvoicesData || []).map(
        (leaseInvoice: any) => {
          const displayInvoice: DisplayInvoice = {
            id: leaseInvoice.invoice_id,
            client_id: leaseInvoice.client_id, // available from view
            client_name: leaseInvoice.client_name,
            client_email: leaseInvoice.client_email,
            client_address: leaseInvoice.client_address,
            client_phone: leaseInvoice.client_phone,
            date: leaseInvoice.invoice_date,
            due_date: leaseInvoice.invoice_due_date,
            status: leaseInvoice.status || "sent",
            total_amount: leaseInvoice.amount,
            paid_amount: 0,
            items: [
              {
                description: `Vehicle Lease (${formatDate(
                  leaseInvoice.billing_period_start
                )} - ${formatDate(leaseInvoice.billing_period_end)})`,
                quantity: 1,
                unit_price: leaseInvoice.amount,
                amount: leaseInvoice.amount,
              },
            ],
            notes: "",
            created_at: leaseInvoice.created_at,
            updated_at: leaseInvoice.updated_at,
            trips: [],
            isLeaseInvoice: true,
            leaseDetails: {
              contractNumber: "-",
              lesseeName: leaseInvoice.client_name,
              lesseeEmail: leaseInvoice.client_email,
              vehicleInfo: `${leaseInvoice.make} ${leaseInvoice.model} (${leaseInvoice.registration})`,
              billingPeriod: {
                start: leaseInvoice.billing_period_start,
                end: leaseInvoice.billing_period_end,
              },
            },
          };
          return displayInvoice;
        }
      );

      // Combine and deduplicate invoices (lease invoices take priority)
      const regularInvoicesFiltered = regularInvoices.filter(
        (inv): inv is DisplayInvoice => inv !== null
      );
      const leaseInvoiceIds = new Set(
        leaseInvoices.map((li: DisplayInvoice) => li.id)
      );

      // Filter out regular invoices that are also lease invoices
      const uniqueRegularInvoices = regularInvoicesFiltered.filter(
        (invoice) => !leaseInvoiceIds.has(invoice.id)
      );

      const allInvoices = [...uniqueRegularInvoices, ...leaseInvoices];
      return allInvoices.sort((a, b) => {
        const aTime = a?.date ? new Date(a.date).getTime() : 0;
        const bTime = b?.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      });
    },
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, address, phone")
        .order("name");
      if (error) throw error;
      return (data || []) as unknown as Client[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("invoices-changes")
      .on(
        "postgres_changes",
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

  useEffect(() => {
    const updateOverdueInvoices = async () => {
      if (!invoices) return;
      const overdueInvoices = invoices.filter(
        (invoice): invoice is DisplayInvoice =>
          invoice !== null && isInvoiceOverdue(invoice)
      );
      if (overdueInvoices.length > 0) {
        await Promise.all(
          overdueInvoices.map((invoice) =>
            supabase
              .from("invoices")
              .update({ status: "overdue" } as any)
              .eq("id", invoice.id as any)
          )
        );
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      }
    };
    updateOverdueInvoices();
  }, [invoices, queryClient]);

  const filteredInvoices = useMemo(() => {
    return invoices?.filter((invoice) => {
      if (!invoice || !("id" in invoice)) return false;
      const matchesSearch =
        searchTerm === "" ||
        invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id
          .substring(0, 8)
          .toUpperCase()
          .includes(searchTerm.toUpperCase());
      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;
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
    refetch: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
      ]),
  };
}
