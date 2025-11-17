import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { formatCurrency } from "@/lib/invoice-helpers";

const recordSchema = z.object({
  employee_id: z.string().min(1, "Employee is required"),
  pay_period_start: z.string().min(1, "Start date is required"),
  pay_period_end: z.string().min(1, "End date is required"),
  base_salary: z.number().min(0, "Base salary must be 0 or greater"),
  hours_worked: z.number().optional().nullable(),
  overtime_hours: z.number().min(0).default(0),
  overtime_rate: z.number().optional().nullable(),
  bonuses: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  status: z.enum(["pending", "approved", "paid", "cancelled"]),
  payment_date: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

interface PayrollRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: {
    id: string;
    employee_id: string;
    pay_period_start: string;
    pay_period_end: string;
    base_salary: number;
    hours_worked: number | null;
    overtime_hours: number;
    overtime_rate: number | null;
    bonuses: number;
    deductions: number;
    allowances: number;
    status: "pending" | "approved" | "paid" | "cancelled";
    payment_date: string | null;
    payment_method: string | null;
    notes: string | null;
  } | null;
  employees: Array<{
    id: string;
    name: string;
    base_salary: number;
    hourly_rate: number | null;
  }>;
}

export function PayrollRecordDialog({
  open,
  onOpenChange,
  record,
  employees,
}: PayrollRecordDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      employee_id: "",
      pay_period_start: "",
      pay_period_end: "",
      base_salary: 0,
      hours_worked: null,
      overtime_hours: 0,
      overtime_rate: null,
      bonuses: 0,
      deductions: 0,
      allowances: 0,
      status: "pending",
      payment_date: null,
      payment_method: null,
      notes: null,
    },
  });

  const selectedEmployee = form.watch("employee_id");
  const employee = employees.find((e) => e.id === selectedEmployee);

  // Auto-fill base salary and hourly rate when employee is selected
  useEffect(() => {
    if (employee && !record) {
      form.setValue("base_salary", employee.base_salary);
      if (employee.hourly_rate) {
        form.setValue("overtime_rate", employee.hourly_rate * 1.5); // Default 1.5x for overtime
      }
    }
  }, [employee, form, record]);

  useEffect(() => {
    if (record && open) {
      form.reset({
        employee_id: record.employee_id,
        pay_period_start: record.pay_period_start.split("T")[0],
        pay_period_end: record.pay_period_end.split("T")[0],
        base_salary: record.base_salary,
        hours_worked: record.hours_worked || null,
        overtime_hours: record.overtime_hours,
        overtime_rate: record.overtime_rate || null,
        bonuses: record.bonuses,
        deductions: record.deductions,
        allowances: record.allowances,
        status: record.status,
        payment_date: record.payment_date ? record.payment_date.split("T")[0] : null,
        payment_method: record.payment_method || null,
        notes: record.notes || null,
      });
    } else if (!record && open) {
      // Set default dates to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      form.reset({
        employee_id: "",
        pay_period_start: firstDay.toISOString().split("T")[0],
        pay_period_end: lastDay.toISOString().split("T")[0],
        base_salary: 0,
        hours_worked: null,
        overtime_hours: 0,
        overtime_rate: null,
        bonuses: 0,
        deductions: 0,
        allowances: 0,
        status: "pending",
        payment_date: null,
        payment_method: null,
        notes: null,
      });
    }
  }, [record, open, form]);

  // Calculate gross and net pay
  const calculations = useMemo(() => {
    const baseSalary = form.watch("base_salary") || 0;
    const hoursWorked = form.watch("hours_worked") || 0;
    const hourlyRate = employee?.hourly_rate || 0;
    const overtimeHours = form.watch("overtime_hours") || 0;
    const overtimeRate = form.watch("overtime_rate") || 0;
    const bonuses = form.watch("bonuses") || 0;
    const deductions = form.watch("deductions") || 0;
    const allowances = form.watch("allowances") || 0;

    // Calculate regular pay (if hourly) or use base salary
    const regularPay = hourlyRate > 0 && hoursWorked > 0 
      ? hoursWorked * hourlyRate 
      : baseSalary;

    // Calculate overtime pay
    const overtimePay = overtimeHours * overtimeRate;

    // Gross pay = regular + overtime + bonuses + allowances
    const grossPay = regularPay + overtimePay + bonuses + allowances;

    // Net pay = gross - deductions
    const netPay = grossPay - deductions;

    return {
      regularPay,
      overtimePay,
      grossPay,
      netPay,
    };
  }, [
    form.watch("base_salary"),
    form.watch("hours_worked"),
    form.watch("overtime_hours"),
    form.watch("overtime_rate"),
    form.watch("bonuses"),
    form.watch("deductions"),
    form.watch("allowances"),
    employee,
  ]);

  const mutation = useMutation({
    mutationFn: async (values: RecordFormValues) => {
      const data = {
        employee_id: values.employee_id,
        pay_period_start: values.pay_period_start,
        pay_period_end: values.pay_period_end,
        base_salary: values.base_salary,
        hours_worked: values.hours_worked || null,
        overtime_hours: values.overtime_hours,
        overtime_rate: values.overtime_rate || null,
        bonuses: values.bonuses,
        deductions: values.deductions,
        allowances: values.allowances,
        gross_pay: calculations.grossPay,
        net_pay: calculations.netPay,
        status: values.status,
        payment_date: values.payment_date || null,
        payment_method: values.payment_method || null,
        notes: values.notes || null,
      };

      if (record) {
        const { error } = await supabase
          .from("payroll_records")
          .update(data)
          .eq("id", record.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payroll_records").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
      toast({
        title: record ? "Record updated" : "Record added",
        description: `Payroll record has been ${record ? "updated" : "added"} successfully.`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: RecordFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>
            {record ? "Edit Payroll Record" : "Add New Payroll Record"}
          </DialogTitle>
          <DialogDescription>
            {record
              ? "Update payroll record information below."
              : "Enter payroll record information below."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pay_period_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Period Start *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pay_period_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Period End *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                name="hours_worked"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours Worked</FormLabel>
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
                name="overtime_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime Hours</FormLabel>
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
                name="overtime_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime Rate</FormLabel>
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
                name="bonuses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bonuses</FormLabel>
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
                name="allowances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowances</FormLabel>
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
                name="deductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductions</FormLabel>
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
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <Input placeholder="Bank Transfer, Cash, etc." {...field} value={field.value || ""} />
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

            {/* Calculation Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Calculation Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Regular Pay:</span>
                  <span className="ml-2 font-medium">{formatCurrency(calculations.regularPay)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Overtime Pay:</span>
                  <span className="ml-2 font-medium">{formatCurrency(calculations.overtimePay)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gross Pay:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(calculations.grossPay)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Net Pay:</span>
                  <span className="ml-2 font-semibold text-primary">
                    {formatCurrency(calculations.netPay)}
                  </span>
                </div>
              </div>
            </div>

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
                  : record
                  ? "Update Record"
                  : "Add Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

