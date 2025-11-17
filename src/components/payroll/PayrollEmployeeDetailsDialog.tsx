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
import { Edit, Trash, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PayrollEmployeeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
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
    created_at: string;
    updated_at: string;
  } | null;
  onEdit: () => void;
  onDelete: () => void;
}

export function PayrollEmployeeDetailsDialog({
  open,
  onOpenChange,
  employee,
  onEdit,
  onDelete,
}: PayrollEmployeeDetailsDialogProps) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription>
                View employee information and payroll details
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
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{employee.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{employee.employee_id || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="outline" className="capitalize mt-1">
                  {employee.role}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={employee.is_active ? "default" : "secondary"}
                  className="mt-1"
                >
                  {employee.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{employee.contact || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{employee.email || "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payroll Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payroll Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Base Salary</p>
                <p className="font-semibold text-lg">{formatCurrency(employee.base_salary)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="font-medium">
                  {employee.hourly_rate ? formatCurrency(employee.hourly_rate) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bank Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bank Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bank Name</p>
                <p className="font-medium">{employee.bank_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bank Account</p>
                <p className="font-medium">{employee.bank_account || "N/A"}</p>
              </div>
            </div>
          </div>

          {employee.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{employee.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p>Created: {new Date(employee.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p>Last Updated: {new Date(employee.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

