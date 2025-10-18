import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Car,
  User,
  Calendar,
  Gauge,
  Fuel,
  Wrench,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Vehicle is required"),
  inspector_name: z.string().min(1, "Inspector name is required"),
  inspection_date: z.string().min(1, "Inspection date is required"),
  pre_trip: z.boolean(),
  post_trip: z.boolean(),
  overall_status: z.enum(["pass", "fail", "conditional"]),
  mileage: z.number().min(0, "Mileage must be positive"),
  fuel_level: z.number().min(0).max(100, "Fuel level must be between 0-100%"),

  // Fluid levels
  engine_oil: z.enum(["good", "low", "needs_change"]),
  coolant: z.enum(["good", "low", "needs_refill"]),
  brake_fluid: z.enum(["good", "low", "needs_refill"]),

  // Vehicle condition
  tires_condition: z.enum(["good", "fair", "poor"]),

  // Safety systems (boolean checks)
  lights_working: z.boolean(),
  brakes_working: z.boolean(),
  steering_working: z.boolean(),
  horn_working: z.boolean(),
  wipers_working: z.boolean(),
  mirrors_clean: z.boolean(),
  seatbelts_working: z.boolean(),

  // Safety equipment
  first_aid_kit: z.boolean(),
  fire_extinguisher: z.boolean(),
  warning_triangle: z.boolean(),
  jack_spare_tire: z.boolean(),
  documents_present: z.boolean(),

  // Cleanliness
  interior_clean: z.boolean(),
  exterior_clean: z.boolean(),

  // Notes
  defects_noted: z.string().optional(),
  corrective_actions: z.string().optional(),
  notes: z.string().optional(),
});

type InspectionFormValues = z.infer<typeof inspectionSchema>;

interface VehicleInspectionFormProps {
  inspection?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VehicleInspectionForm({
  inspection,
  onSuccess,
  onCancel,
}: VehicleInspectionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch vehicles for dropdown
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-inspection"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration")
        .order("make");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: inspection
      ? {
          vehicle_id: inspection.vehicle_id,
          inspector_name: inspection.inspector_name,
          inspection_date: inspection.inspection_date,
          pre_trip: inspection.pre_trip,
          post_trip: inspection.post_trip,
          overall_status: inspection.overall_status,
          mileage: inspection.mileage,
          fuel_level: inspection.fuel_level,
          engine_oil: inspection.engine_oil,
          coolant: inspection.coolant,
          brake_fluid: inspection.brake_fluid,
          tires_condition: inspection.tires_condition,
          lights_working: inspection.lights_working,
          brakes_working: inspection.brakes_working,
          steering_working: inspection.steering_working,
          horn_working: inspection.horn_working,
          wipers_working: inspection.wipers_working,
          mirrors_clean: inspection.mirrors_clean,
          seatbelts_working: inspection.seatbelts_working,
          first_aid_kit: inspection.first_aid_kit,
          fire_extinguisher: inspection.fire_extinguisher,
          warning_triangle: inspection.warning_triangle,
          jack_spare_tire: inspection.jack_spare_tire,
          documents_present: inspection.documents_present,
          interior_clean: inspection.interior_clean,
          exterior_clean: inspection.exterior_clean,
          defects_noted: inspection.defects_noted || "",
          corrective_actions: inspection.corrective_actions || "",
          notes: inspection.notes || "",
        }
      : {
          vehicle_id: "",
          inspector_name: "",
          inspection_date: new Date().toISOString().split("T")[0],
          pre_trip: true,
          post_trip: false,
          overall_status: "pass",
          mileage: 0,
          fuel_level: 100,
          engine_oil: "good",
          coolant: "good",
          brake_fluid: "good",
          tires_condition: "good",
          lights_working: true,
          brakes_working: true,
          steering_working: true,
          horn_working: true,
          wipers_working: true,
          mirrors_clean: true,
          seatbelts_working: true,
          first_aid_kit: true,
          fire_extinguisher: true,
          warning_triangle: true,
          jack_spare_tire: true,
          documents_present: true,
          interior_clean: true,
          exterior_clean: true,
          defects_noted: "",
          corrective_actions: "",
          notes: "",
        },
  });

  // Auto-calculate overall status based on critical checks
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      // Only recalculate if a relevant field changed, not overall_status itself
      if (name === "overall_status") return;

      const criticalChecks = [
        values.lights_working,
        values.brakes_working,
        values.steering_working,
        values.seatbelts_working,
      ];

      const fluidChecks = [
        values.engine_oil !== "needs_change",
        values.brake_fluid !== "needs_refill",
      ];

      const hasCriticalFailure = criticalChecks.some((check) => !check);
      const hasFluidIssues = fluidChecks.some((check) => !check);
      const hasTireIssues = values.tires_condition === "poor";

      let newStatus: "pass" | "fail" | "conditional";

      if (hasCriticalFailure || hasTireIssues) {
        newStatus = "fail";
      } else if (hasFluidIssues || values.tires_condition === "fair") {
        newStatus = "conditional";
      } else {
        newStatus = "pass";
      }

      // Only update if the status actually changed
      if (values.overall_status !== newStatus) {
        form.setValue("overall_status", newStatus, { shouldValidate: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: InspectionFormValues) => {
    setIsSubmitting(true);
    try {
      if (inspection) {
        // Update existing inspection
        const { error } = await supabase
          .from("vehicle_inspections")
          .update(values as any)
          .eq("id", inspection.id);

        if (error) throw error;

        toast({
          title: "Inspection updated",
          description: "The vehicle inspection has been updated successfully.",
        });
      } else {
        // Create new inspection
        const { error } = await supabase
          .from("vehicle_inspections")
          .insert(values as any);

        if (error) throw error;

        toast({
          title: "Inspection created",
          description: "The vehicle inspection has been created successfully.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving inspection:", error);
      toast({
        title: "Error",
        description: "Failed to save inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "conditional":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles?.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} (
                            {vehicle.registration})
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
                name="inspector_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter inspector name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inspection_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? parseISO(field.value) : undefined}
                        onDateChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overall_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Overall Status
                      {getStatusIcon(field.value)}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="conditional">Conditional</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Status is auto-calculated based on critical checks
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inspection Type */}
            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="pre_trip"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Pre-Trip Inspection</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="post_trip"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Post-Trip Inspection</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Readings */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Vehicle Readings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Mileage (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter current mileage"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuel_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Level (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Enter fuel level percentage"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fluid Levels */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Fluid Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="engine_oil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engine Oil</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="needs_change">
                          Needs Change
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coolant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coolant</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="needs_refill">
                          Needs Refill
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brake_fluid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brake Fluid</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="needs_refill">
                          Needs Refill
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Condition */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Vehicle Condition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="tires_condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tires Condition</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Safety Systems */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Systems Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "lights_working", label: "Lights Working" },
                { name: "brakes_working", label: "Brakes Working" },
                { name: "steering_working", label: "Steering Working" },
                { name: "horn_working", label: "Horn Working" },
                { name: "wipers_working", label: "Wipers Working" },
                { name: "mirrors_clean", label: "Mirrors Clean" },
                { name: "seatbelts_working", label: "Seatbelts Working" },
              ].map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name as any}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          {item.label}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Equipment */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Safety Equipment Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "first_aid_kit", label: "First Aid Kit Present" },
                {
                  name: "fire_extinguisher",
                  label: "Fire Extinguisher Present",
                },
                { name: "warning_triangle", label: "Warning Triangle Present" },
                { name: "jack_spare_tire", label: "Jack & Spare Tire Present" },
                {
                  name: "documents_present",
                  label: "Vehicle Documents Present",
                },
              ].map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name as any}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          {item.label}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cleanliness */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Vehicle Cleanliness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interior_clean"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Interior Clean</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exterior_clean"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Exterior Clean</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes and Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Notes and Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="defects_noted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Defects Noted</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any defects or issues found during inspection..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="corrective_actions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Corrective Actions Required</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any corrective actions needed..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional observations or comments..."
                      className="min-h-[60px]"
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
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : inspection
              ? "Update Inspection"
              : "Create Inspection"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
