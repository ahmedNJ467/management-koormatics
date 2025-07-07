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
  contract_id: z.string().min(1, "Please select a contract"),
  lessee_name: z.string().min(2, "Lessee name must be at least 2 characters"),
  lessee_email: z.string().email("Please enter a valid email address"),
  lessee_phone: z.string().min(10, "Please enter a valid phone number"),
  lessee_address: z.string().min(10, "Please enter a complete address"),
  lease_start_date: z.string().min(1, "Please select a start date"),
  lease_end_date: z.string().min(1, "Please select an end date"),
  daily_rate: z.number().min(1, "Daily rate must be greater than 0"),
  lease_status: z.enum([
    "active",
    "pending",
    "expired",
    "terminated",
    "upcoming",
  ]),
  payment_status: z.enum(["current", "overdue", "partial", "paid_ahead"]),
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
  contract_id: string;
  lessee_name: string;
  lessee_email: string;
  lessee_phone: string;
  lessee_address: string;
  lease_start_date: string;
  lease_end_date: string;
  daily_rate: number;
  lease_status: "active" | "pending" | "expired" | "terminated" | "upcoming";
  payment_status: "current" | "overdue" | "partial" | "paid_ahead";
  notes?: string;
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
      contract_id: "",
      lessee_name: "",
      lessee_email: "",
      lessee_phone: "",
      lessee_address: "",
      lease_start_date: "",
      lease_end_date: "",
      daily_rate: 0,
      lease_status: "pending",
      payment_status: "current",
      notes: "",
      insurance_required: true,
      maintenance_included: false,
      driver_included: false,
      fuel_included: false,
      assigned_driver_id: "none",
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
        .eq("status", "active")
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
          .eq("status", "active")
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

  // Pre-fill form when editing
  useEffect(() => {
    if (lease) {
      form.reset({
        vehicle_id: lease.vehicle_id,
        contract_id: lease.contract_id,
        lessee_name: lease.lessee_name,
        lessee_email: lease.lessee_email,
        lessee_phone: lease.lessee_phone,
        lessee_address: lease.lessee_address,
        lease_start_date: lease.lease_start_date.split("T")[0],
        lease_end_date: lease.lease_end_date.split("T")[0],
        daily_rate: lease.daily_rate,
        lease_status: lease.lease_status,
        payment_status: lease.payment_status,
        notes: lease.notes || "",
        insurance_required: lease.insurance_required,
        maintenance_included: lease.maintenance_included,
        driver_included: lease.driver_included,
        fuel_included: lease.fuel_included,
        assigned_driver_id: lease.assigned_driver_id || "none",
      });
    }
  }, [lease, form]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: LeaseFormData) => {
      if (lease) {
        // Update existing lease
        const { error } = await supabase
          .from("vehicle_leases")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lease.id);
        if (error) throw error;
      } else {
        // Create new lease
        const { error } = await supabase.from("vehicle_leases").insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
        if (error) throw error;
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
    onError: (error) => {
      console.error("Error saving lease:", error);
      toast({
        title: "Error",
        description: "Failed to save lease agreement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeaseFormData) => {
    // TEMPORARY FIX: Map new schema to old database schema
    const submitData = {
      vehicle_id: data.vehicle_id,
      contract_id: data.contract_id,
      lessee_name: data.lessee_name,
      lessee_email: data.lessee_email,
      lessee_phone: data.lessee_phone,
      lessee_address: data.lessee_address,
      lease_start_date: data.lease_start_date,
      lease_end_date: data.lease_end_date,

      // Store both daily_rate and monthly_rate
      daily_rate: data.daily_rate,
      monthly_rate: (data.daily_rate || 0) * 30,

      // Set default values for required old fields
      security_deposit: 0,
      mileage_limit: 12000, // Default annual mileage
      excess_mileage_rate: 0.25, // Default per-mile rate
      early_termination_fee: 0,

      // Generate contract number from contract_id
      contract_number: data.contract_id
        ? `LSE-${data.contract_id.slice(-6)}`
        : `LSE-${Date.now().toString().slice(-6)}`,

      lease_status: data.lease_status,
      payment_status: data.payment_status,
      notes: data.notes || null,
      insurance_required: data.insurance_required,
      maintenance_included: data.maintenance_included,
      driver_included: data.driver_included,
      fuel_included: data.fuel_included,
      assigned_driver_id:
        data.assigned_driver_id === "none" ? null : data.assigned_driver_id,
    };

    console.log("Submitting lease data (with schema mapping):", submitData);
    saveMutation.mutate(submitData);
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a vehicle for lease" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles?.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.year}) -{" "}
                          {vehicle.registration}
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
                  <FormLabel>Select Contract *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a contract for this lease" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contracts?.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.name} - {contract.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select an active contract to associate with this lease
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Lessee Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-green-600" />
              Lessee Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lessee_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lessee_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lessee_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lessee_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="123 Main Street, City, State, ZIP Code"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid_ahead">Paid Ahead</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a driver for this lease" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No driver assigned</SelectItem>
                        {drivers?.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name} - {driver.phone}
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
