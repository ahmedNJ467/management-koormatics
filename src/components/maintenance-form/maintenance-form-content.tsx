import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UseFormReturn } from "react-hook-form";
import type { Maintenance, Vehicle } from "@/lib/types";
import { SparePart } from "@/components/spare-parts/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import {
  X,
  Package,
  Calendar,
  Wrench,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MaintenanceFormContentProps {
  form: UseFormReturn<any>;
  maintenance: Maintenance | undefined;
  isSubmitting: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: (values: any) => Promise<void>;
}

export function MaintenanceFormContent({
  form,
  maintenance,
  isSubmitting,
  onCancel,
  onDelete,
  onSubmit,
}: MaintenanceFormContentProps) {
  const [selectedParts, setSelectedParts] = useState<
    { id: string; quantity: number }[]
  >(maintenance?.spare_parts || []);

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("make", { ascending: true });

      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const { data: spareParts } = useQuery({
    queryKey: ["spare-parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("*")
        .gt("quantity", 0)
        .in("status", ["in_stock", "low_stock"])
        .order("name", { ascending: true });

      if (error) throw error;
      return data as SparePart[];
    },
  });

  const handlePartSelection = (partId: string) => {
    const isSelected = selectedParts.some((p) => p.id === partId);

    if (isSelected) {
      setSelectedParts(selectedParts.filter((p) => p.id !== partId));
    } else {
      setSelectedParts([...selectedParts, { id: partId, quantity: 1 }]);
    }
  };

  const handlePartQuantityChange = (partId: string, quantity: number) => {
    setSelectedParts(
      selectedParts.map((p) => (p.id === partId ? { ...p, quantity } : p))
    );
  };

  const handleFormSubmit = (values: any) => {
    // Add selected parts to the form values
    const formValues = {
      ...values,
      spare_parts: selectedParts,
    };
    onSubmit(formValues);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Vehicle & Basic Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Wrench className="h-5 w-5" />
            <span>Vehicle & Basic Information</span>
          </div>

          <FormField
            control={form.control}
            name="vehicle_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Vehicle *</FormLabel>
                <FormDescription>
                  Select the vehicle that requires maintenance
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose a vehicle..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles?.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} - {vehicle.registration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Maintenance Date *
                  </FormLabel>
                  <FormDescription>
                    When was/is the maintenance performed
                  </FormDescription>
                  <FormControl>
                    <Input type="date" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_scheduled"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Next Scheduled</FormLabel>
                  <FormDescription>
                    When is the next maintenance due
                  </FormDescription>
                  <FormControl>
                    <Input type="date" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Maintenance Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            <span>Maintenance Details</span>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Description *</FormLabel>
                <FormDescription>
                  Brief description of the maintenance work performed
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="e.g., Oil change, brake pad replacement, engine tune-up..."
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="expense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    External Expense (USD) *
                  </FormLabel>
                  <FormDescription>
                    Cost of external services or parts
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="h-11"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Status</FormLabel>
                  <FormDescription>
                    Current status of the maintenance
                  </FormDescription>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="service_provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Service Provider</FormLabel>
                <FormDescription>
                  Name of the service provider or mechanic
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="e.g., ABC Auto Service, John's Garage..."
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Spare Parts Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5" />
            <span>Spare Parts Used</span>
          </div>

          <div className="text-sm text-muted-foreground">
            Select spare parts from inventory that were used in this maintenance
          </div>

          <Card className="border-dashed">
            <CardContent className="p-4">
              {spareParts?.length ? (
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
                  {spareParts.map((part) => (
                    <Card
                      key={part.id}
                      className={`border transition-colors ${
                        selectedParts.some((p) => p.id === part.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              id={`part-${part.id}`}
                              checked={selectedParts.some(
                                (p) => p.id === part.id
                              )}
                              onCheckedChange={() =>
                                handlePartSelection(part.id)
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`part-${part.id}`}
                                className="font-medium cursor-pointer block"
                              >
                                {part.name}
                              </label>
                              <div className="text-sm text-muted-foreground mt-1">
                                <div>Part #: {part.part_number}</div>
                                <div>Category: {part.category}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span>Available:</span>
                                  <span
                                    className={`font-medium ${
                                      part.quantity <=
                                      (part.min_stock_level || 5)
                                        ? "text-orange-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {part.quantity} units
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {selectedParts.some((p) => p.id === part.id) && (
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-sm font-medium">Qty:</span>
                              <Input
                                type="number"
                                min="1"
                                max={part.quantity}
                                className="w-20 h-8 text-center"
                                value={
                                  selectedParts.find((p) => p.id === part.id)
                                    ?.quantity || 1
                                }
                                onChange={(e) =>
                                  handlePartQuantityChange(
                                    part.id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No spare parts available in inventory
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add spare parts to inventory to use them in maintenance
                    records
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            <span>Additional Notes</span>
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Notes</FormLabel>
                <FormDescription>
                  Any additional information about the maintenance
                </FormDescription>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional notes, observations, or special instructions..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {maintenance && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isSubmitting}
              >
                Delete Record
              </Button>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>{maintenance ? "Update Record" : "Add Record"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
