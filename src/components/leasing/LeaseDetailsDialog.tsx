import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import {
  Car,
  User,
  Calendar,
  DollarSign,
  FileText,
  Shield,
  Settings,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface VehicleLease {
  id: string;
  vehicle_id: string;
  lessee_name: string;
  lessee_email: string;
  lessee_phone: string;
  lessee_address: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rate?: number;
  daily_rate?: number;
  security_deposit?: number;
  lease_status: "active" | "pending" | "expired" | "terminated" | "upcoming";
  payment_status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  contract_number?: string;
  contract_id?: string;
  notes?: string;
  insurance_required: boolean;
  maintenance_included: boolean;
  driver_included: boolean;
  fuel_included: boolean;
  assigned_driver_id?: string;
  early_termination_fee?: number;
  created_at: string;
  updated_at: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    registration: string;
    vin: string;
  };
  assigned_driver?: {
    name: string;
    phone: string;
  };
}

interface LeaseDetailsDialogProps {
  lease: VehicleLease | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaseDetailsDialog({
  lease,
  open,
  onOpenChange,
}: LeaseDetailsDialogProps) {
  if (!lease) return null;

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "MMMM dd, yyyy") : "Invalid Date";
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const end = parseISO(endDate);
    if (!isValid(end)) return null;
    return differenceInDays(end, new Date());
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        label: "Active",
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600",
      },
      pending: {
        label: "Pending",
        variant: "secondary" as const,
        icon: Clock,
        color: "text-yellow-600",
      },
      expired: {
        label: "Expired",
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-red-600",
      },
      terminated: {
        label: "Terminated",
        variant: "outline" as const,
        icon: XCircle,
        color: "text-gray-600",
      },
      upcoming: {
        label: "Upcoming",
        variant: "secondary" as const,
        icon: Calendar,
        color: "text-blue-600",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      draft: {
        label: "Draft",
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-800",
      },
      sent: {
        label: "Sent",
        variant: "default" as const,
        color: "bg-blue-100 text-blue-800",
      },
      paid: {
        label: "Paid",
        variant: "default" as const,
        color: "bg-green-100 text-green-800",
      },
      overdue: {
        label: "Overdue",
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800",
      },
      cancelled: {
        label: "Cancelled",
        variant: "outline" as const,
        color: "bg-gray-100 text-gray-600",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const daysUntilExpiry = getDaysUntilExpiry(lease.lease_end_date);
  const isExpiringSoon =
    daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;

  const totalLeaseValue = (() => {
    const startDate = parseISO(lease.lease_start_date);
    const endDate = parseISO(lease.lease_end_date);
    if (!isValid(startDate) || !isValid(endDate)) return 0;

    const months = differenceInDays(endDate, startDate) / 30.44; // Average days per month
    return Math.round(months * (lease.monthly_rate || lease.daily_rate || 0));
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Lease Agreement Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">
                  Contract {lease.contract_number || lease.contract_id || "N/A"}
                </span>
                <div className="flex gap-2">
                  {getStatusBadge(lease.lease_status)}
                  {getPaymentStatusBadge(lease.payment_status)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isExpiringSoon && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">
                      Lease expires in {daysUntilExpiry} days
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    $
                    {(
                      lease.monthly_rate ||
                      lease.daily_rate ||
                      0
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lease.monthly_rate ? "Monthly Rate" : "Daily Rate"}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${totalLeaseValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Value
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lease.vehicle ? (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Vehicle
                      </div>
                      <div className="font-medium">
                        {lease.vehicle.make} {lease.vehicle.model} (
                        {lease.vehicle.year})
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Registration
                      </div>
                      <div className="font-medium">
                        {lease.vehicle.registration}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">VIN</div>
                      <div className="font-mono text-sm">
                        {lease.vehicle.vin}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">
                    Vehicle information not available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lessee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Lessee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{lease.lessee_name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lease.lessee_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lease.lessee_phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{lease.lessee_address}</span>
                </div>
              </CardContent>
            </Card>

            {/* Lease Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Lease Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Start Date
                  </div>
                  <div className="font-medium">
                    {formatDate(lease.lease_start_date)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">End Date</div>
                  <div className="font-medium">
                    {formatDate(lease.lease_end_date)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">
                    {Math.round(
                      differenceInDays(
                        parseISO(lease.lease_end_date),
                        parseISO(lease.lease_start_date)
                      ) / 30.44
                    )}{" "}
                    months
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  Financial Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Security Deposit
                  </div>
                  <div className="font-medium">
                    ${(lease.security_deposit || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Early Termination Fee
                  </div>
                  <div className="font-medium">
                    ${(lease.early_termination_fee || 0).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Additional Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Shield
                    className={`h-4 w-4 ${
                      lease.insurance_required
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      lease.insurance_required
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    Insurance{" "}
                    {lease.insurance_required ? "Required" : "Not Required"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings
                    className={`h-4 w-4 ${
                      lease.maintenance_included
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      lease.maintenance_included
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    Maintenance{" "}
                    {lease.maintenance_included ? "Included" : "Not Included"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User
                    className={`h-4 w-4 ${
                      lease.driver_included ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      lease.driver_included ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    Driver {lease.driver_included ? "Included" : "Not Included"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Car
                    className={`h-4 w-4 ${
                      lease.fuel_included ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      lease.fuel_included ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    Fuel {lease.fuel_included ? "Included" : "Not Included"}
                  </span>
                </div>
              </div>

              {/* Driver Information - Only show if driver is included */}
              {lease.driver_included && lease.assigned_driver && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Assigned Driver
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          {lease.assigned_driver.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Phone className="h-3 w-3" />
                        <span>{lease.assigned_driver.phone}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {lease.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Additional Notes
                    </div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">
                      {lease.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Created: {formatDate(lease.created_at)}</span>
                <span>Last Updated: {formatDate(lease.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
