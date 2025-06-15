import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UseFormReturn } from "react-hook-form";
import type { Maintenance, Vehicle } from "@/lib/types";
import { SparePart } from "@/components/spare-parts/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { X } from "lucide-react";

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
  const [selectedParts, setSelectedParts] = useState<{id: string, quantity: number}[]>(
    maintenance?.spare_parts || []
  );

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
    const isSelected = selectedParts.some(p => p.id === partId);
    
    if (isSelected) {
      setSelectedParts(selectedParts.filter(p => p.id !== partId));
    } else {
      setSelectedParts([...selectedParts, { id: partId, quantity: 1 }]);
    }
  };

  const handlePartQuantityChange = (partId: string, quantity: number) => {
    setSelectedParts(selectedParts.map(p => 
      p.id === partId ? { ...p, quantity } : p
    ));
  };

  const handleFormSubmit = (values: any) => {
    // Add selected parts to the form values
    const formValues = {
      ...values,
      spare_parts: selectedParts
    };
    onSubmit(formValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="vehicle_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
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
                <FormLabel>Date*</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>Next Scheduled</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description*</FormLabel>
              <FormControl>
                <Input placeholder="Enter maintenance description" {...field} />
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
                <FormLabel>External Expense (USD)*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
              <FormLabel>Service Provider</FormLabel>
              <FormControl>
                <Input placeholder="Enter service provider name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Spare Parts Selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Use Spare Parts</h3>
          <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto">
            {spareParts?.length ? (
              spareParts.map((part) => (
                <Card key={part.id} className={`border ${selectedParts.some(p => p.id === part.id) ? 'border-primary' : ''}`}>
                  <CardHeader className="p-3 pb-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`part-${part.id}`}
                          checked={selectedParts.some(p => p.id === part.id)}
                          onCheckedChange={() => handlePartSelection(part.id)}
                        />
                        <label htmlFor={`part-${part.id}`} className="font-medium cursor-pointer">
                          {part.name}
                        </label>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Available: {part.quantity}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {part.part_number} - {part.category}
                      </div>
                      {selectedParts.some(p => p.id === part.id) && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Quantity:</span>
                          <Input
                            type="number"
                            min="1"
                            max={part.quantity}
                            className="w-20 h-8"
                            value={selectedParts.find(p => p.id === part.id)?.quantity || 1}
                            onChange={(e) => handlePartQuantityChange(part.id, parseInt(e.target.value))}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-muted-foreground text-center py-6">
                No spare parts available in inventory
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter any additional notes"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {maintenance && (
            <Button 
              type="button"
              variant="destructive"
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : maintenance ? "Update Record" : "Add Record"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
