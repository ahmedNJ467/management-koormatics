import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { parseISO, isValid } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import type { DriverFormValues } from "./types";

interface DriverFieldsProps {
  form: UseFormReturn<DriverFormValues>;
}

export function DriverFields({ form }: DriverFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="contact"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contact</FormLabel>
            <FormControl>
              <Input placeholder="+1234567890" {...field} />
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1">Phone or email</p>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Nairobi Yard A" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="license_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>License Number</FormLabel>
            <FormControl>
              <Input placeholder="DL12345" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="license_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>License Type</FormLabel>
            <FormControl>
              <Input placeholder="Commercial" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="license_expiry"
        render={({ field }) => (
          <FormItem>
            <FormLabel>License Expiry</FormLabel>
            <FormControl>
              <DatePicker
                date={
                  field.value
                    ? isValid(new Date(field.value))
                      ? new Date(field.value)
                      : undefined
                    : undefined
                }
                onDateChange={(date) => {
                  field.onChange(date ? date.toISOString().split("T")[0] : "");
                }}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1">
              Set a reminder before expiry
            </p>
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
            <FormControl>
              <select
                {...field}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="is_vip"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 md:col-span-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>VIP Driver</FormLabel>
              <p className="text-xs text-muted-foreground">
                Mark this driver as a VIP driver
              </p>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
