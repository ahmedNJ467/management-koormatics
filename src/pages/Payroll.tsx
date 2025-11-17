import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  DollarSign,
  Users,
  Wallet,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/invoice-helpers";
import { PayrollEmployeeDialog } from "@/components/payroll/PayrollEmployeeDialog";
import { PayrollRecordDialog } from "@/components/payroll/PayrollRecordDialog";
import { PayrollEmployeeDetailsDialog } from "@/components/payroll/PayrollEmployeeDetailsDialog";
import { PayrollRecordDetailsDialog } from "@/components/payroll/PayrollRecordDetailsDialog";
import { DeletePayrollDialog } from "@/components/payroll/DeletePayrollDialog";

type EmployeeRole = "driver" | "mechanic" | "admin" | "manager" | "other";
type PayrollStatus = "pending" | "approved" | "paid" | "cancelled";

interface PayrollEmployee {
  id: string;
  name: string;
  employee_id: string | null;
  role: EmployeeRole;
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
}

interface PayrollRecord {
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
  status: PayrollStatus;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: PayrollEmployee;
}

export default function Payroll() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"employees" | "records">("employees");
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [employeeDetailsOpen, setEmployeeDetailsOpen] = useState(false);
  const [recordDetailsOpen, setRecordDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "employee" | "record"; id: string } | null>(null);

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ["payroll-employees"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("payroll_employees" as any)
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          // If table doesn't exist yet, return empty array
          if (error.code === "42P01" || error.message?.includes("does not exist")) {
            console.warn("Payroll employees table not found. Please run the migration.");
            return [] as PayrollEmployee[];
          }
          throw error;
        }
        return (data || []) as unknown as PayrollEmployee[];
      } catch (error: any) {
        // Handle any other errors gracefully
        if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
          return [] as PayrollEmployee[];
        }
        throw error;
      }
    },
    retry: false,
  });

  // Fetch drivers for linking
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch payroll records
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["payroll-records"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("payroll_records" as any)
          .select(`
            *,
            employee:payroll_employees(*)
          `)
          .order("pay_period_start", { ascending: false });

        if (error) {
          // If table doesn't exist yet, return empty array
          if (error.code === "42P01" || error.message?.includes("does not exist")) {
            console.warn("Payroll records table not found. Please run the migration.");
            return [] as PayrollRecord[];
          }
          throw error;
        }
        return (data || []).map((r: any) => ({
          ...r,
          employee: r.employee as PayrollEmployee,
        })) as PayrollRecord[];
      } catch (error: any) {
        // Handle any other errors gracefully
        if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
          return [] as PayrollRecord[];
        }
        throw error;
      }
    },
    retry: false,
  });

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !searchTerm ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.contact?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || emp.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [employees, searchTerm, roleFilter]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        !searchTerm ||
        record.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.is_active).length;
    const totalRecords = records.length;
    const pendingRecords = records.filter((r) => r.status === "pending").length;
    const paidRecords = records.filter((r) => r.status === "paid").length;
    const totalPaid = records
      .filter((r) => r.status === "paid")
      .reduce((sum, r) => sum + Number(r.net_pay), 0);
    const pendingAmount = records
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + Number(r.net_pay), 0);

    return {
      activeEmployees,
      totalRecords,
      pendingRecords,
      paidRecords,
      totalPaid,
      pendingAmount,
    };
  }, [employees, records]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: "employee" | "record"; id: string }) => {
      const table = (type === "employee" ? "payroll_employees" : "payroll_records") as any;
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-employees"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
      toast({
        title: "Deleted successfully",
        description: "The item has been deleted.",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (type: "employee" | "record", id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status: PayrollStatus) => {
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

  const getStatusIcon = (status: PayrollStatus) => {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="p-3 sm:p-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                Payroll Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage employee payroll and payment records
              </p>
            </div>
            <div className="flex gap-2">
              {activeTab === "employees" ? (
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedEmployee(null);
                    setEmployeeDialogOpen(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedRecord(null);
                    setRecordDialogOpen(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payroll Record
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{analytics.activeEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatCurrency(analytics.totalPaid)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {formatCurrency(analytics.pendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.pendingRecords} records
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{analytics.totalRecords}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.paidRecords} paid
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={activeTab === "employees" ? "default" : "outline"}
                onClick={() => setActiveTab("employees")}
              >
                <Users className="h-4 w-4 mr-2" />
                Employees
              </Button>
              <Button
                variant={activeTab === "records" ? "default" : "outline"}
                onClick={() => setActiveTab("records")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Payroll Records
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  activeTab === "employees"
                    ? "Search employees..."
                    : "Search payroll records..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {activeTab === "employees" ? (
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Employees Table */}
          {activeTab === "employees" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow
                        key={employee.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setEmployeeDetailsOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.employee_id || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(employee.base_salary)}</TableCell>
                        <TableCell>{employee.contact || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={employee.is_active ? "default" : "secondary"}
                          >
                            {employee.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Records Table */}
          {activeTab === "records" && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No payroll records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow
                        key={record.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedRecord(record);
                          setRecordDetailsOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          {record.employee?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {new Date(record.pay_period_start).toLocaleDateString()} -{" "}
                          {new Date(record.pay_period_end).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{formatCurrency(record.gross_pay)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(record.net_pay)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(record.status)}
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.payment_date
                            ? new Date(record.payment_date).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <PayrollEmployeeDetailsDialog
        open={employeeDetailsOpen}
        onOpenChange={setEmployeeDetailsOpen}
        employee={selectedEmployee}
        onEdit={() => {
          setEmployeeDetailsOpen(false);
          setEmployeeDialogOpen(true);
        }}
        onDelete={() => {
          if (selectedEmployee) {
            setEmployeeDetailsOpen(false);
            setItemToDelete({ type: "employee", id: selectedEmployee.id });
            setDeleteDialogOpen(true);
          }
        }}
      />

      <PayrollRecordDetailsDialog
        open={recordDetailsOpen}
        onOpenChange={setRecordDetailsOpen}
        record={selectedRecord}
        onEdit={() => {
          setRecordDetailsOpen(false);
          setRecordDialogOpen(true);
        }}
        onDelete={() => {
          if (selectedRecord) {
            setRecordDetailsOpen(false);
            setItemToDelete({ type: "record", id: selectedRecord.id });
            setDeleteDialogOpen(true);
          }
        }}
      />

      <PayrollEmployeeDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        employee={selectedEmployee}
        drivers={drivers}
      />

      <PayrollRecordDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        record={selectedRecord}
        employees={employees}
      />

      <DeletePayrollDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        item={itemToDelete}
        onConfirm={() => {
          if (itemToDelete) {
            deleteMutation.mutate(itemToDelete);
          }
        }}
      />
    </div>
  );
}

