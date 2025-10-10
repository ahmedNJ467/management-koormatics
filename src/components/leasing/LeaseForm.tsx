import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Car,
  User,
  DollarSign,
  Calendar,
  FileText,
  Shield,
  Settings,
  Save,
  X,
} from "lucide-react";

const leaseFormSchema = z.object({
  vehicle_id: z.string().min(1, "Please select a vehicle"),
  contract_id: z.string().optional(),
  client_id: z.string().min(1, "Please select a client"),
  lease_start_date: z.string().min(1, "Please select a start date"),
  lease_end_date: z.string().min(1, "Please select an end date"),
  daily_rate: z.number().min(1, "Daily rate must be greater than 0"),
  monthly_rate: z.number().optional(),
  security_deposit: z.number().optional(),
  early_termination_fee: z.number().optional(),
  contract_number: z.string().optional(),
  lease_status: z.enum([
    "active",
    "pending",
    "expired",
    "terminated",
    "upcoming",
  ]),
  payment_status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  notes: z.string().optional(),
  insurance_required: z.boolean(),
  maintenance_included: z.boolean(),
  driver_included: z.boolean(),
  fuel_included: z.boolean(),
  assigned_driver_id: z.string().nullable().optional(),
});

type LeaseFormData = z.infer<typeof leaseFormSchema>;

interface VehicleLease {
  id: string;
  vehicle_id: string;
  contract_id?: string;
  client_id: string;
  lease_start_date: string;
  lease_end_date: string;
  daily_rate?: number | null;
  monthly_rate?: number;
  security_deposit?: number;
  early_termination_fee?: number;
  contract_number?: string;
  lease_status:
    | "active"
    | "pending"
    | "expired"
    | "terminated"
    | "upcoming"
    | string
    | null;
  payment_status:
    | "draft"
    | "sent"
    | "paid"
    | "overdue"
    | "cancelled"
    | string
    | null;
  notes?: string | null;
  insurance_required: boolean;
  maintenance_included: boolean;
  driver_included: boolean;
  fuel_included: boolean;
  assigned_driver_id?: string;
  created_at: string;
  updated_at: string;
}

interface LeaseFormProps {
  lease?: VehicleLease | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LeaseForm({ lease, onSuccess, onCancel }: LeaseFormProps) {
  const { toast } = useToast();

  const form = useForm<LeaseFormData>({
    resolver: zodResolver(leaseFormSchema),
    defaultValues: {
      vehicle_id: "",
      contract_id: "no-contract",
      client_id: "",
      lease_start_date: "",
      lease_end_date: "",
      daily_rate: 0,
      monthly_rate: 0,
      security_deposit: 0,
      early_termination_fee: 0,
      contract_number: "",
      lease_status: "pending",
      payment_status: "draft",
      notes: "",
      insurance_required: true,
      maintenance_included: false,
      driver_included: false,
      fuel_included: false,
      assigned_driver_id: "no-driver",
    },
  });

  // Fetch available vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, year, registration, vin")
        .order("make");
      if (error) throw error;
      return data;
    },
  });

  // Fetch available contracts
  const { data: contracts } = useQuery({
    queryKey: ["contracts-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, name, client_name, status")
        .eq("status", "active" as any)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch available drivers
  const { data: drivers } = useQuery({
    queryKey: ["drivers-available"],
    queryFn: async () => {
      try {
        // Try with status filter first
        const { data, error } = await supabase
          .from("drivers")
          .select("id, name, phone")
          .eq("status", "active" as any)
          .order("name");

        if (error) {
          // If status column doesn't exist, fall back to all drivers
          const { data: allData, error: fallbackError } = await supabase
            .from("drivers")
            .select("id, name, phone")
            .order("name");

          if (fallbackError) throw fallbackError;
          return allData;
        }

        return data;
      } catch (error) {
        // Final fallback - get all drivers without any filters
        const { data: allData, error: finalError } = await supabase
          .from("drivers")
          .select("id, name, phone")
          .order("name");

        if (finalError) throw finalError;
        return allData;
      }
    },
  });

  // Fetch available clients
  const {
    data: clients,
    isLoading: clientsLoading,
    error: clientsError,
  } = useQuery({
    queryKey: ["clients-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, type, email, phone, address")
        .order("name");
      if (error) throw error;
      console.log("Fetched clients:", data);
      return data;
    },
  });

  // Debug clients loading
  useEffect(() => {
    console.log("Clients loading state:", {
      clientsLoading,
      clientsError,
      clientsCount: clients?.length,
    });
  }, [clientsLoading, clientsError, clients]);

  // Pre-fill form when editing
  useEffect(() => {
    if (lease && vehicles && contracts && drivers && clients) {
      console.log("Prefilling form with lease data:", {
        lease,
        vehicles: vehicles?.length,
        contracts: contracts?.length,
        drivers: drivers?.length,
      });

      form.reset({
        vehicle_id: lease.vehicle_id,
        contract_id: lease.contract_id || "no-contract",
        client_id: lease.client_id,
        lease_start_date: lease.lease_start_date.split("T")[0],
        lease_end_date: lease.lease_end_date.split("T")[0],
        daily_rate: lease.daily_rate || 0,
        monthly_rate: lease.monthly_rate || 0,
        security_deposit: lease.security_deposit || 0,
        early_termination_fee: lease.early_termination_fee || 0,
        contract_number: lease.contract_number || "",
        lease_status: (lease.lease_status || "pending") as
          | "active"
          | "expired"
          | "pending"
          | "terminated"
          | "upcoming",
        payment_status: (lease.payment_status || "draft") as
          | "draft"
          | "sent"
          | "paid"
          | "overdue"
          | "cancelled",
        notes: lease.notes || "",
        insurance_required: lease.insurance_required,
        maintenance_included: lease.maintenance_included,
        driver_included: lease.driver_included,
        fuel_included: lease.fuel_included,
        assigned_driver_id: lease.assigned_driver_id || "no-driver",
      });

      console.log(
        "Form reset completed. Current form values:",
        form.getValues()
      );

      // Debug the specific fields that should be prefilled
      console.log("Vehicle ID from lease:", lease.vehicle_id);
      console.log("Contract ID from lease:", lease.contract_id);
      console.log("Lease Status from lease:", lease.lease_status);
      console.log("Payment Status from lease:", lease.payment_status);
      console.log("Form vehicle_id value:", form.getValues("vehicle_id"));
      console.log("Form contract_id value:", form.getValues("contract_id"));
      console.log("Form lease_status value:", form.getValues("lease_status"));
      console.log(
        "Form payment_status value:",
        form.getValues("payment_status")
      );
    }
  }, [lease, vehicles, contracts, drivers, clients, form]);

  // Watch form values for debugging
  const formValues = form.watch();
  useEffect(() => {
    if (lease) {
      console.log("Current form values:", formValues);
    }
  }, [formValues, lease]);

  // Auto-calculate monthly rate when daily rate changes
  const dailyRate = form.watch("daily_rate");
  useEffect(() => {
    if (dailyRate && dailyRate > 0) {
      const calculatedMonthlyRate = dailyRate * 30;
      const currentMonthlyRate = form.getValues("monthly_rate");
      // Only update if the monthly rate hasn't been manually set or is 0
      if (!currentMonthlyRate || currentMonthlyRate === 0) {
        form.setValue("monthly_rate", calculatedMonthlyRate);
      }
    }
  }, [dailyRate, form]);

  // Auto-generate contract number for new leases
  useEffect(() => {
    if (!lease && !form.getValues("contract_number")) {
      const generatePreviewNumber = () => {
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const random = Math.floor(1000 + Math.random() * 9000);
        return `LSE-${yy}${mm}${dd}-${random}`;
      };

      // Set a preview contract number (will be regenerated on submit to ensure uniqueness)
      form.setValue("contract_number", generatePreviewNumber());
    }
  }, [lease, form]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (submitData: any) => {
      try {
        console.log("Mutation received data:", submitData);

        if (lease) {
          // Update existing lease
          console.log("Updating existing lease with ID:", lease.id);
          const { error } = await supabase
            .from("vehicle_leases")
            .update({
              ...submitData,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", lease.id as any);
          if (error) {
            console.error("Update error:", error);
            console.error("Update error details:", {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            });
            throw error;
          }
        } else {
          // Create new lease
          console.log("Creating new lease");

          // First, let's test if we can query the table
          const { data: testData, error: testError } = await supabase
            .from("vehicle_leases")
            .select("id")
            .limit(1);

          if (testError) {
            console.error("Table access test failed:", testError);
            throw new Error(
              `Cannot access vehicle_leases table: ${testError.message}`
            );
          }

          console.log("Table access test passed, proceeding with insert");

          const { error } = await supabase.from("vehicle_leases").insert({
            ...submitData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any);
          if (error) {
            console.error("Insert error:", error);
            console.error("Insert error details:", {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            });
            throw error;
          }
        }
      } catch (err) {
        console.error("Caught error in mutation:", err);
        console.error("Error type:", typeof err);
        console.error("Error constructor:", err?.constructor?.name);
        throw err;
      }
    },
    onSuccess: () => {
      toast({
        title: lease ? "Lease updated" : "Lease created",
        description: lease
          ? "The lease agreement has been updated successfully."
          : "New lease agreement has been created successfully.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Error saving lease:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      let errorMessage = "Failed to save lease agreement";

      // Handle specific database constraint violations
      if (error?.code === "23505") {
        if (error?.message?.includes("vehicle_leases_contract_number_key")) {
          errorMessage =
            "A lease with this contract number already exists. Please use a different contract number.";
        } else if (error?.message?.includes("unique constraint")) {
          errorMessage =
            "This record already exists. Please check your data and try again.";
        } else {
          errorMessage =
            "Duplicate entry detected. Please check your data and try again.";
        }
      } else if (error?.code === "23503") {
        errorMessage =
          "Referenced data not found. Please check your selections and try again.";
      } else if (error?.code === "23514") {
        errorMessage =
          "Invalid data provided. Please check your input and try again.";
      } else if (error?.message) {
        errorMessage = `Failed to save lease agreement: ${error.message}`;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Generate a unique contract number
  const generateUniqueContractNumber = async (): Promise<string> => {
    const generateNumber = () => {
      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      return `LSE-${yy}${mm}${dd}-${random}`;
    };

    let contractNumber = generateNumber();
    let attempts = 0;
    const maxAttempts = 10;

    // Check if contract number already exists
    while (attempts < maxAttempts) {
      const { data: existingLease } = await supabase
        .from("vehicle_leases")
        .select("contract_number")
        .eq("contract_number", contractNumber)
        .single();

      if (!existingLease) {
        return contractNumber;
      }

      // Generate a new number if this one exists
      contractNumber = generateNumber();
      attempts++;
    }

    // Fallback: use timestamp with microseconds for uniqueness
    return `LSE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  };

  const onSubmit = async (data: LeaseFormData) => {
    try {
      // Calculate monthly rate if not provided
      const monthlyRate = data.monthly_rate || (data.daily_rate || 0) * 30;

      // Generate contract number if not provided
      let contractNumber = data.contract_number;
      if (!contractNumber) {
        if (data.contract_id) {
          contractNumber = `LSE-${data.contract_id.slice(-6)}`;
        } else {
          contractNumber = await generateUniqueContractNumber();
        }
      } else {
        // If user provided a contract number, check if it already exists (only for new leases)
        if (!lease) {
          const { data: existingLease } = await supabase
            .from("vehicle_leases")
            .select("contract_number")
            .eq("contract_number", contractNumber)
            .single();

          if (existingLease) {
            toast({
              title: "Contract Number Already Exists",
              description:
                "A lease with this contract number already exists. Please use a different contract number.",
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Get client information from selected client
      const selectedClient = clients?.find(
        (client) => client.id === data.client_id
      );

      const submitData = {
        vehicle_id: data.vehicle_id,
        contract_id:
          data.contract_id === "no-contract" ? null : data.contract_id,
        // Include both client_id (for future) and lessee fields (for current DB)
        client_id: data.client_id,
        lessee_name: selectedClient?.name || "",
        lessee_email: selectedClient?.email || "",
        lessee_phone: selectedClient?.phone || "",
        lessee_address: selectedClient?.address || "",
        lease_start_date: data.lease_start_date,
        lease_end_date: data.lease_end_date,
        daily_rate: data.daily_rate,
        monthly_rate: monthlyRate,
        security_deposit: data.security_deposit || 0,
        early_termination_fee: data.early_termination_fee || 0,
        contract_number: contractNumber,
        lease_status: data.lease_status,
        payment_status: data.payment_status,
        notes: data.notes || undefined,
        insurance_required: data.insurance_required,
        maintenance_included: data.maintenance_included,
        driver_included: data.driver_included,
        fuel_included: data.fuel_included,
        assigned_driver_id:
          data.assigned_driver_id === "no-driver"
            ? null
            : data.assigned_driver_id,
      };

      console.log("Submitting lease data:", submitData);
      saveMutation.mutate(submitData);
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast({
        title: "Error",
        description: "Failed to prepare lease data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Vehicle Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5 text-blue-600" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Vehicle *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    key={`vehicle-${field.value || "empty"}`}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vehicle for lease" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles
                        ?.filter((vehicle) => vehicle && "id" in vehicle)
                        .map((vehicle) => (
                          <SelectItem
                            key={(vehicle as any).id}
                            value={(vehicle as any).id}
                          >
                            {(vehicle as any).make} {(vehicle as any).model} (
                            {(vehicle as any).year}) -{" "}
                            {(vehicle as any).registration}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Contract</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    key={`contract-${field.value || "empty"}`}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a contract for this lease" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no-contract">
                        No contract selected
                      </SelectItem>
                      {contracts
                        ?.filter((contract) => contract && "id" in contract)
                        .map((contract) => (
                          <SelectItem
                            key={(contract as any).id}
                            value={(contract as any).id}
                          >
                            {(contract as any).name} -{" "}
                            {(contract as any).client_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select an active contract to associate with this lease
                    (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Client Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-green-600" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Client *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={clientsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            clientsLoading
                              ? "Loading clients..."
                              : "Choose a client"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients && clients.length > 0 ? (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{client.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {client.type} • {client.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-clients" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Lease Terms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
              Lease Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lease_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lease_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lease_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lease Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      key={`lease-status-${field.value || "empty"}`}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      key={`payment-status-${field.value || "empty"}`}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Financial Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="daily_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Rate ($) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="50.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value)
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Daily rental rate for this vehicle lease
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1500.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value)
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Monthly rental rate (auto-calculated from daily rate)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="security_deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Deposit ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="500.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value)
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Security deposit amount required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="early_termination_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Early Termination Fee ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value)
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Fee for early lease termination
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contract_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="LSE-123456"
                      {...field}
                      className={
                        field.value ? "bg-green-50 border-green-200" : ""
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value ? (
                      <span className="text-green-600">
                        ✓ Contract number: {field.value}
                      </span>
                    ) : (
                      "Unique contract identifier (auto-generated if empty)"
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Terms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-gray-600" />
              Additional Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="insurance_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Insurance Required</FormLabel>
                      <FormDescription>
                        Lessee must maintain comprehensive insurance
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenance_included"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Maintenance Included</FormLabel>
                      <FormDescription>
                        Regular maintenance is included in lease
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driver_included"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Driver Included</FormLabel>
                      <FormDescription>
                        Professional driver provided with vehicle
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuel_included"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Fuel Included</FormLabel>
                      <FormDescription>
                        Fuel costs are covered in the lease
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Driver Assignment - Only show if driver is included */}
            {form.watch("driver_included") && (
              <FormField
                control={form.control}
                name="assigned_driver_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Driver</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a driver for this lease" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-driver">
                          No driver assigned
                        </SelectItem>
                        {drivers
                          ?.filter((driver) => driver && "id" in driver)
                          .map((driver) => (
                            <SelectItem
                              key={(driver as any).id}
                              value={(driver as any).id}
                            >
                              {(driver as any).name} - {(driver as any).phone}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a driver to assign to this lease (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional terms, conditions, or notes about this lease..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saveMutation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending
              ? "Saving..."
              : lease
              ? "Update Lease"
              : "Create Lease"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
