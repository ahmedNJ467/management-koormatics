import React, { useState } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  Car,
  User,
  MapPin,
  DollarSign,
  FileText,
  Camera,
  Shield,
  Calendar,
  Clock,
  Trash2,
} from "lucide-react";

import { ImageUpload } from "./ImageUpload";

function ExistingIncidentImages({
  incidentId,
  position = "bottom" as "top" | "bottom",
}: {
  incidentId: string;
  position?: "top" | "bottom";
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data } = useQuery({
    queryKey: ["incident-images", incidentId],
    enabled: !!incidentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_incident_images")
        .select("image_url, name")
        .eq("incident_id", incidentId as any);
      if (error) throw error;
      return data || [];
    },
  });

  if (!data || data.length === 0) return null;

  const getFileNameFromUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/");
      return parts[parts.length - 1] || null;
    } catch {
      return null;
    }
  };

  const handleRemove = async (img: {
    image_url: string;
    name?: string | null;
  }) => {
    const fileName = img.name || getFileNameFromUrl(img.image_url);
    if (!fileName) {
      toast({
        title: "Unable to remove",
        description: "Missing filename.",
        variant: "destructive",
      });
      return;
    }
    const confirmDelete = window.confirm(
      "Remove this photo from the incident?"
    );
    if (!confirmDelete) return;
    // Remove from storage
    const storagePath = `incidents/${incidentId}/${fileName}`;
    const { error: storageErr } = await supabase.storage
      .from("images")
      .remove([storagePath]);
    if (storageErr) {
      console.error(storageErr);
      toast({
        title: "Failed to remove photo",
        description: storageErr.message,
        variant: "destructive",
      });
      return;
    }
    // Remove from DB
    const { error: dbErr } = await supabase
      .from("vehicle_incident_images")
      .delete()
      .eq("incident_id", incidentId as any)
      .eq("name", fileName as any);
    if (dbErr) {
      console.error(dbErr);
      toast({
        title: "Failed to update database",
        description: dbErr.message,
        variant: "destructive",
      });
      return;
    }
    // If no images left, update photos_attached=false
    const { count } = await supabase
      .from("vehicle_incident_images")
      .select("id", { count: "exact", head: true })
              .eq("incident_id", incidentId as any);
    if ((count ?? 0) === 0) {
      await supabase
        .from("vehicle_incident_reports")
        .update({ photos_attached: false } as any)
        .eq("id", incidentId as any);
    }
    await queryClient.invalidateQueries({
      queryKey: ["incident-images", incidentId],
    });
    toast({ title: "Photo removed" });
  };
  return (
    <div className="mt-4">
      <div className="text-sm font-medium mb-2">Existing Photos</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.map((img: any, idx: number) => (
          <div
            key={idx}
            className="group relative border rounded-lg overflow-hidden"
          >
            <div className="aspect-square bg-muted">
              <img
                src={img.image_url}
                alt={img.name || `Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(img)}
                className="absolute top-2 right-2 inline-flex items-center gap-1 rounded bg-red-600 text-white text-xs px-2 py-1 opacity-90 hover:opacity-100"
                title="Remove photo"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>
            {img.name && (
              <div className="px-2 py-1 text-xs text-muted-foreground truncate">
                {img.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const incidentReportSchema = z
  .object({
    vehicle_id: z.string().min(1, "Vehicle is required"),
    driver_id: z.string().optional(),
    incident_date: z.string().min(1, "Incident date is required"),
    incident_time: z.string().optional(),
    incident_type: z.enum([
      "accident",
      "theft",
      "vandalism",
      "breakdown",
      "traffic_violation",
      "other",
    ]),
    severity: z.enum(["minor", "moderate", "severe", "critical"]),
    status: z.enum(["reported", "investigating", "resolved", "closed"]),
    location: z.string().min(1, "Location is required"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    injuries_reported: z.boolean(),
    police_report_number: z.string().optional(),
    insurance_claim_number: z.string().optional(),
    estimated_damage_cost: z.number().min(0).optional(),
    actual_repair_cost: z.number().min(0).optional(),
    third_party_involved: z.boolean(),
    third_party_details: z.string().optional(),
    witness_details: z.string().optional(),
    photos_attached: z.boolean(),
    reported_by: z.string().min(1, "Reporter name is required"),
    follow_up_required: z.boolean(),
    follow_up_date: z.string().optional(),
    notes: z.string().optional(),

    incident_images: z
      .array(
        z.object({
          id: z.string(),
          file: z.any(),
          preview: z.string(),
          name: z.string(),
          size: z.number(),
          type: z.string(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.third_party_involved && !data.third_party_details) {
        return false;
      }
      return true;
    },
    {
      message: "Third party details are required when third party is involved",
      path: ["third_party_details"],
    }
  )
  .refine(
    (data) => {
      if (data.follow_up_required && !data.follow_up_date) {
        return false;
      }
      return true;
    },
    {
      message: "Follow-up date is required when follow-up is needed",
      path: ["follow_up_date"],
    }
  );

type IncidentReportFormValues = z.infer<typeof incidentReportSchema>;

interface IncidentReportFormProps {
  report?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function IncidentReportForm({
  report,
  onSuccess,
  onCancel,
}: IncidentReportFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch vehicles for dropdown
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration")
        .order("make");
      if (error) throw error;
      return data;
    },
  });

  // Fetch drivers for dropdown
  const { data: drivers } = useQuery({
    queryKey: ["drivers-for-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name, license_number")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<IncidentReportFormValues>({
    resolver: zodResolver(incidentReportSchema),
    defaultValues: report
      ? {
          vehicle_id: report.vehicle_id,
          driver_id: report.driver_id || "none",
          incident_date: report.incident_date,
          incident_time: report.incident_time || "",
          incident_type: report.incident_type,
          severity: report.severity,
          status: report.status,
          location: report.location,
          description: report.description,
          injuries_reported: report.injuries_reported,
          police_report_number: report.police_report_number || "",
          insurance_claim_number: report.insurance_claim_number || "",
          estimated_damage_cost: report.estimated_damage_cost || 0,
          actual_repair_cost: report.actual_repair_cost || 0,
          third_party_involved: report.third_party_involved,
          third_party_details: report.third_party_details || "",
          witness_details: report.witness_details || "",
          photos_attached: report.photos_attached,
          reported_by: report.reported_by,
          follow_up_required: report.follow_up_required,
          follow_up_date: report.follow_up_date || "",
          notes: report.notes || "",

          incident_images: [] as {
            id: string;
            file: any;
            preview: string;
            name: string;
            size: number;
            type: string;
          }[],
        }
      : {
          vehicle_id: "",
          driver_id: "none",
          incident_date: new Date().toISOString().split("T")[0],
          incident_time: new Date().toTimeString().slice(0, 5),
          incident_type: "accident",
          severity: "minor",
          status: "reported",
          location: "",
          description: "",
          injuries_reported: false,
          police_report_number: "",
          insurance_claim_number: "",
          estimated_damage_cost: 0,
          actual_repair_cost: 0,
          third_party_involved: false,
          third_party_details: "",
          witness_details: "",
          photos_attached: false,
          reported_by: "",
          follow_up_required: false,
          follow_up_date: "",
          notes: "",

          incident_images: [] as {
            id: string;
            file: any;
            preview: string;
            name: string;
            size: number;
            type: string;
          }[],
        },
  });

  const onSubmit = async (values: IncidentReportFormValues) => {
    setIsSubmitting(true);
    try {
      // Clean up the data - remove empty strings and zero values for optional fields
      // Remove incident_images as it's not a database field
      const { incident_images, ...formValues } = values;
      const imagesToUpload = (incident_images || []).filter((img) => img?.file);

      const cleanedValues = {
        vehicle_id: values.vehicle_id,
        driver_id: values.driver_id === "none" ? null : values.driver_id,
        incident_date: values.incident_date,
        incident_time: values.incident_time || null,
        incident_type: values.incident_type,
        severity: values.severity,
        status: values.status,
        location: values.location,
        description: values.description,
        injuries_reported: values.injuries_reported,
        police_report_number: values.police_report_number || null,
        insurance_claim_number: values.insurance_claim_number || null,
        estimated_damage_cost: values.estimated_damage_cost || null,
        actual_repair_cost: values.actual_repair_cost || null,
        third_party_involved: values.third_party_involved,
        third_party_details: values.third_party_details || null,
        witness_details: values.witness_details || null,
        // If new images present, ensure photos_attached true
        photos_attached: imagesToUpload.length > 0 || values.photos_attached,
        reported_by: values.reported_by,
        follow_up_required: values.follow_up_required,
        follow_up_date: values.follow_up_date || null,
        notes: values.notes || null,
      };

      if (report) {
        // Update existing report
        const { error } = await supabase
          .from("vehicle_incident_reports")
          .update(cleanedValues as any)
          .eq("id", report.id as any);

        if (error) throw error;

        // Upload images for existing report and insert DB rows
        if (imagesToUpload.length > 0) {
          const insertedImageRows: { image_url: string; name?: string }[] = [];
          for (const img of imagesToUpload) {
            const file = img.file as File;
            const safeName = `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}-${(file.name || "image").replace(
              /[^a-zA-Z0-9_.-]/g,
              "_"
            )}`;
            const path = `incidents/${report.id}/${safeName}`;
            const { error: uploadErr } = await supabase.storage
              .from("images")
              .upload(path, file, {
                cacheControl: "3600",
                upsert: true,
                contentType: file.type || "image/jpeg",
              });
            if (uploadErr) {
              console.error("Image upload failed:", uploadErr);
              continue;
            }
            const { data } = supabase.storage.from("images").getPublicUrl(path);
            if (data?.publicUrl) {
              insertedImageRows.push({
                image_url: data.publicUrl,
                name: file.name,
              });
            }
          }
          if (insertedImageRows.length > 0) {
            await supabase.from("vehicle_incident_images").insert(
              insertedImageRows.map((r) => ({
                incident_id: report.id as any,
                image_url: r.image_url,
                name: r.name || null,
              })) as any
            );
            await supabase
              .from("vehicle_incident_reports")
              .update({ photos_attached: true } as any)
              .eq("id", report.id as any);
          }
        }

        toast({
          title: "Incident report updated",
          description: "The incident report has been updated successfully.",
        });
      } else {
        // Create new report
        const { data: created, error } = await supabase
          .from("vehicle_incident_reports")
          .insert(cleanedValues as any)
          .select("id")
          .single();

        if (error) throw error;

        // Upload images for new report and insert DB rows
        if (created && 'id' in created && created.id && imagesToUpload.length > 0) {
          const insertedImageRows: { image_url: string; name?: string }[] = [];
          for (const img of imagesToUpload) {
            const file = img.file as File;
            const safeName = `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}-${(file.name || "image").replace(
              /[^a-zA-Z0-9_.-]/g,
              "_"
            )}`;
            const path = `incidents/${created.id as string}/${safeName}`;
            const { error: uploadErr } = await supabase.storage
              .from("images")
              .upload(path, file, {
                cacheControl: "3600",
                upsert: true,
                contentType: file.type || "image/jpeg",
              });
            if (uploadErr) {
              console.error("Image upload failed:", uploadErr);
              continue;
            }
            const { data } = supabase.storage.from("images").getPublicUrl(path);
            if (data?.publicUrl) {
              insertedImageRows.push({
                image_url: data.publicUrl,
                name: file.name,
              });
            }
          }
          if (insertedImageRows.length > 0) {
            await supabase.from("vehicle_incident_images").insert(
              insertedImageRows.map((r) => ({
                incident_id: created.id as any,
                image_url: r.image_url,
                name: r.name || null,
              })) as any
            );
            await supabase
              .from("vehicle_incident_reports")
              .update({ photos_attached: true } as any)
              .eq("id", created.id as any);
          }
        }

        toast({
          title: "Incident report created",
          description: "The incident report has been created successfully.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving incident report:", error);
      toast({
        title: "Error",
        description: "Failed to save incident report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Incident Information
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
                          <SelectItem key={(vehicle as any).id} value={(vehicle as any).id}>
                            {(vehicle as any).make} {(vehicle as any).model} (
                            {(vehicle as any).registration})
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
                name="driver_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          No driver specified
                        </SelectItem>
                        {drivers?.map((driver) => (
                          <SelectItem key={(driver as any).id} value={(driver as any).id}>
                            {(driver as any).name} ({(driver as any).license_number})
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
                name="incident_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Date</FormLabel>
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
                name="incident_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Time (Optional)</FormLabel>
                    <FormControl>
                      <Input type="time" placeholder="HH:MM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="incident_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="accident">Accident</SelectItem>
                        <SelectItem value="theft">Theft</SelectItem>
                        <SelectItem value="vandalism">Vandalism</SelectItem>
                        <SelectItem value="breakdown">Breakdown</SelectItem>
                        <SelectItem value="traffic_violation">
                          Traffic Violation
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="reported">Reported</SelectItem>
                        <SelectItem value="investigating">
                          Investigating
                        </SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reported_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reported By</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Name of person reporting incident"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Exact location where incident occurred"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of what happened..."
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

        {/* Additional Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Checkboxes */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="injuries_reported"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Injuries Reported</FormLabel>
                        <FormDescription>
                          Check if any injuries were reported
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="third_party_involved"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Third Party Involved</FormLabel>
                        <FormDescription>
                          Check if other parties were involved
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photos_attached"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Photos Attached</FormLabel>
                        <FormDescription>
                          Check if photos are available
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="follow_up_required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Follow-up Required</FormLabel>
                        <FormDescription>
                          Check if follow-up action is needed
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Report Numbers and Costs */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="police_report_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Police Report Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter police report number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insurance_claim_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Claim Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter insurance claim number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_damage_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Damage Cost ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actual_repair_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Repair Cost ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Conditional Fields */}
            {form.watch("third_party_involved") && (
              <FormField
                control={form.control}
                name="third_party_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Third Party Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Details about other parties involved (names, contact info, insurance details)..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("follow_up_required") && (
              <FormField
                control={form.control}
                name="follow_up_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date</FormLabel>
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
            )}

            <FormField
              control={form.control}
              name="witness_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Witness Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Details about witnesses (names, contact info, statements)..."
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
                      placeholder="Any additional information or observations..."
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

        {/* Image Upload (preload existing images from DB as read-only thumbs) */}
        <FormField
          control={form.control}
          name="incident_images"
          render={({ field }) => (
            <FormItem>
              <ImageUpload
                value={(field.value || []).map((img) => ({
                  id: img.id || Math.random().toString(),
                  file: img.file,
                  preview: img.preview || "",
                  name: img.name || "",
                  size: img.size || 0,
                  type: img.type || "",
                }))}
                onChange={field.onChange}
                maxImages={10}
                maxFileSize={5}
              />
              {/* Existing stored images */}
              {report && <ExistingIncidentImages incidentId={report.id} />}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : report
              ? "Update Report"
              : "Create Report"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
