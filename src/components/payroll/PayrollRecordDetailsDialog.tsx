import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/invoice-helpers";
import { Edit, Trash, CheckCircle, Clock, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PayrollRecordDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: {
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
    gross_pay: number;
    net_pay: number;
    status: "pending" | "approved" | "paid" | "cancelled";
    payment_date: string | null;
    payment_method: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    employee?: {
      name: string;
      employee_id: string | null;
      role: string;
    };
  } | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function PayrollRecordDetailsDialog({
  open,
  onOpenChange,
  record,
  onEdit,
  onDelete,
}: PayrollRecordDetailsDialogProps) {
  if (!record) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "approved":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const overtimePay = (record.overtime_hours || 0) * (record.overtime_rate || 0);
  // Calculate regular pay - if hours worked is provided, use base_salary as fallback
  // In a real scenario, you'd calculate: hours_worked * hourly_rate
  const regularPay = record.base_salary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Payroll Record Details</DialogTitle>
              <DialogDescription>
                View payroll record information and payment details
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee & Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Employee & Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Employee</p>
                <p className="font-medium">{record.employee?.name || "Unknown"}</p>
                {record.employee?.employee_id && (
                  <p className="text-xs text-muted-foreground">
                    ID: {record.employee.employee_id}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(record.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(record.status)}
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pay Period */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pay Period</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {new Date(record.pay_period_start).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {new Date(record.pay_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Earnings Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Earnings Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Base Salary / Regular Pay</span>
                <span className="font-medium">{formatCurrency(regularPay)}</span>
              </div>
              {record.hours_worked && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hours Worked</span>
                  <span className="font-medium">{record.hours_worked} hrs</span>
                </div>
              )}
              {record.overtime_hours > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Overtime Hours</span>
                    <span className="font-medium">{record.overtime_hours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Overtime Rate</span>
                    <span className="font-medium">
                      {record.overtime_rate ? formatCurrency(record.overtime_rate) : "N/A"} /hr
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Overtime Pay</span>
                    <span className="font-medium">{formatCurrency(overtimePay)}</span>
                  </div>
                </>
              )}
              {record.bonuses > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bonuses</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(record.bonuses)}
                  </span>
                </div>
              )}
              {record.allowances > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Allowances</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(record.allowances)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Gross Pay</span>
                <span className="font-semibold text-lg">{formatCurrency(record.gross_pay)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          {record.deductions > 0 && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">Deductions</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Deductions</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(record.deductions)}
                  </span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Net Pay */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Net Pay</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(record.net_pay)}
              </span>
            </div>
          </div>

          {/* Payment Information */}
          {(record.payment_date || record.payment_method) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {record.payment_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Date</p>
                      <p className="font-medium">
                        {new Date(record.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {record.payment_method && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium">{record.payment_method}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {record.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p>Created: {new Date(record.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p>Last Updated: {new Date(record.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

