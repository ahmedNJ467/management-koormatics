import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  employee_id: z.string().optional().nullable(),
  role: z.enum(["driver", "mechanic", "admin", "manager", "other"]),
  driver_id: z.string().optional().nullable(),
  base_salary: z.number().min(0, "Base salary must be 0 or greater"),
  hourly_rate: z.number().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  email: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val === "" || z.string().email().safeParse(val).success, {
      message: "Invalid email",
    }),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface PayrollEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: {
    id: string;
    name: string;
    employee_id: string | null;
    role: "driver" | "mechanic" | "admin" | "manager" | "other";
    driver_id: string | null;
    base_salary: number;
    hourly_rate: number | null;
    bank_account: string | null;
    bank_name: string | null;
    contact: string | null;
    email: string | null;
    notes: string | null;
    is_active: boolean;
  } | null;
  drivers: Array<{ id: string; name: string }>;
}

export function PayrollEmployeeDialog({
  open,
  onOpenChange,
  employee,
  drivers,
}: PayrollEmployeeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      employee_id: "",
      role: "driver",
      driver_id: null,
      base_salary: 0,
      hourly_rate: null,
      bank_account: "",
      bank_name: "",
      contact: "",
      email: "",
      notes: "",
      is_active: true,
    },
  });

  const selectedDriverId = form.watch("driver_id");

  // Fetch driver details when a driver is selected
  const { data: selectedDriver } = useQuery({
    queryKey: ["driver", selectedDriverId],
    queryFn: async () => {
      if (!selectedDriverId) return null;
      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("id, name, contact, phone")
          .eq("id", selectedDriverId)
          .maybeSingle();
        
        if (error) {
          console.warn("Failed to fetch driver details:", error);
          return null;
        }
        return data;
      } catch (error) {
        console.warn("Error fetching driver details:", error);
        return null;
      }
    },
    enabled: !!selectedDriverId && !employee, // Only fetch when adding new employee
    retry: false, // Don't retry on error to avoid spam
  });

  // Populate form fields when driver is selected
  useEffect(() => {
    if (selectedDriver && !employee && open) {
      const currentValues = form.getValues();
      // Populate name if empty
      if (!currentValues.name || currentValues.name.trim() === "") {
        form.setValue("name", selectedDriver.name || "", {
          shouldValidate: true,
        });
      }
      // Populate contact if empty (use contact or phone as fallback)
      if (!currentValues.contact || currentValues.contact.trim() === "") {
        form.setValue(
          "contact",
          selectedDriver.contact || selectedDriver.phone || "",
          { shouldValidate: true }
        );
      }
    }
  }, [selectedDriver, employee, open, form]);

  useEffect(() => {
    if (employee && open) {
      form.reset({
        name: employee.name,
        employee_id: employee.employee_id || "",
        role: employee.role,
        driver_id: employee.driver_id || null,
        base_salary: employee.base_salary,
        hourly_rate: employee.hourly_rate || null,
        bank_account: employee.bank_account || "",
        bank_name: employee.bank_name || "",
        contact: employee.contact || "",
        email: employee.email || "",
        notes: employee.notes || "",
        is_active: employee.is_active,
      });
    } else if (!employee && open) {
      form.reset({
        name: "",
        employee_id: "",
        role: "driver",
        driver_id: null,
        base_salary: 0,
        hourly_rate: null,
        bank_account: "",
        bank_name: "",
        contact: "",
        email: "",
        notes: "",
        is_active: true,
      });
    }
  }, [employee, open, form]);

  const mutation = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      const data = {
        name: values.name,
        employee_id: values.employee_id || null,
        role: values.role,
        driver_id: values.driver_id || null,
        base_salary: values.base_salary,
        hourly_rate: values.hourly_rate || null,
        bank_account: values.bank_account || null,
        bank_name: values.bank_name || null,
        contact: values.contact || null,
        email: values.email || null,
        notes: values.notes || null,
        is_active: values.is_active,
      };

      if (employee) {
        const { error } = await supabase
          .from("payroll_employees" as any)
          .update(data)
          .eq("id", employee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payroll_employees" as any).insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-employees"] });
      toast({
        title: employee ? "Employee updated" : "Employee added",
        description: `Employee has been ${employee ? "updated" : "added"} successfully.`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save employee",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: EmployeeFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? "Update employee information below."
              : "Enter employee information below."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input placeholder="EMP001" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="mechanic">Mechanic</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                    <FormLabel>Link to Driver (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
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
                name="base_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Salary *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        value={field.value || ""}
                      />
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
                      <Input placeholder="+1234567890" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Bank Name" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bank_account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account</FormLabel>
                    <FormControl>
                      <Input placeholder="Account Number" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active Employee</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving..."
                  : employee
                  ? "Update Employee"
                  : "Add Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

