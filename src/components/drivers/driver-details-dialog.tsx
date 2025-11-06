import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, X, Crown, Check, AlertTriangle, Calendar, FileText, Phone, Mail, CreditCard, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { Driver } from "@/lib/types";

interface DriverDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
  onEdit: () => void;
  onDelete: () => void;
}

export const DriverDetailsDialog = ({
  isOpen,
  onOpenChange,
  driver,
  onEdit,
  onDelete,
}: DriverDetailsDialogProps) => {
  if (!driver) return null;

  const isLicenseExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    const expiry = new Date(expiryDate);
    return expiry <= thirtyDaysFromNow && expiry >= now;
  };

  const isLicenseExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = new Date(expiryDate);
    return expiry < now;
  };

  const isExpiring = isLicenseExpiringSoon(driver.license_expiry);
  const isExpired = isLicenseExpired(driver.license_expiry);

  const getStatusBadge = () => {
    switch (driver.status) {
      case "active":
        return {
          label: "Active",
          variant: "default" as const,
          className: "bg-green-500/20 text-green-600 border-green-500/30",
          icon: Check,
        };
      case "inactive":
        return {
          label: "Inactive",
          variant: "secondary" as const,
          className: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
          icon: AlertTriangle,
        };
      case "on_leave":
        return {
          label: "On Leave",
          variant: "outline" as const,
          className: "bg-gray-500/20 text-gray-600 border-gray-500/30",
          icon: X,
        };
      default:
        return {
          label: "Unknown",
          variant: "outline" as const,
          className: "bg-gray-500/20 text-gray-600 border-gray-500/30",
          icon: X,
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-10">{driver.name}</DialogTitle>
          <DialogDescription>
            Driver Details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Profile Section */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={driver.avatar_url} alt={driver.name} />
                <AvatarFallback className="text-2xl font-semibold bg-muted/50">
                  {driver.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center gap-2">
                {driver.is_vip && (
                  <Badge
                    className="bg-purple-500/20 text-purple-600 border-purple-500/30"
                    variant="outline"
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    VIP Driver
                  </Badge>
                )}
                <Badge
                  className={statusBadge.className}
                  variant={statusBadge.variant}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusBadge.label}
                </Badge>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Contact</span>
                </div>
                <p className="text-sm">{driver.contact}</p>
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">License Number</span>
              </div>
              <p className="text-sm font-semibold">{driver.license_number || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">License Type</span>
              </div>
              <p className="text-sm">{driver.license_type || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">License Expiry</span>
              </div>
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-semibold ${
                    isExpired
                      ? "text-red-600 dark:text-red-400"
                      : isExpiring
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-foreground"
                  }`}
                >
                  {driver.license_expiry
                    ? format(new Date(driver.license_expiry), "MMM dd, yyyy")
                    : "N/A"}
                </p>
                {(isExpired || isExpiring) && (
                  <Badge
                    variant="destructive"
                    className="bg-red-500/20 text-red-600 border-red-500/30 text-xs"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {isExpired ? "Expired" : "Expiring Soon"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-lg font-semibold mb-2">Documents</h3>
            <div className="space-y-3">
              {driver.document_url && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">License Document</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.document_url.split("/").pop()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(driver.document_url, "_blank")}
                  >
                    View
                  </Button>
                </div>
              )}

              {driver.airport_id_url && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Airport ID Card</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.airport_id_url.split("/").pop()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(driver.airport_id_url, "_blank")}
                  >
                    View
                  </Button>
                </div>
              )}

              {!driver.document_url && !driver.airport_id_url && (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

