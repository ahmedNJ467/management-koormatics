import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Upload,
  Filter,
  AlertTriangle,
  Calendar,
  Users,
  Car,
  FileText,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import { Driver } from "@/lib/types";
import { useState } from "react";

interface DriverQuickActionsProps {
  drivers: Driver[];
  onExportDrivers: () => void;
  onImportDrivers: () => void;
  onSendBulkMessage: () => void;
  onGenerateReport: () => void;
}

export function DriverQuickActions({
  drivers,
  onExportDrivers,
  onImportDrivers,
  onSendBulkMessage,
  onGenerateReport,
}: DriverQuickActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Calculate quick stats
  const activeDrivers = drivers.filter((d) => d.status === "active").length;
  const expiringLicenses = drivers.filter((d) => {
    if (!d.license_expiry) return false;
    const expiryDate = new Date(d.license_expiry);
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
  }).length;
  const expiredLicenses = drivers.filter((d) => {
    if (!d.license_expiry) return false;
    const expiryDate = new Date(d.license_expiry);
    const now = new Date();
    return expiryDate < now;
  }).length;

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await onExportDrivers();
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      await onImportDrivers();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkMessage = async () => {
    setIsLoading(true);
    try {
      await onSendBulkMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReport = async () => {
    setIsLoading(true);
    try {
      await onGenerateReport();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Common tasks and bulk operations for driver management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {activeDrivers}
            </div>
            <div className="text-sm text-green-700">Active</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {expiringLicenses}
            </div>
            <div className="text-sm text-orange-700">Expiring</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {expiredLicenses}
            </div>
            <div className="text-sm text-red-700">Expired</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Drivers
          </Button>

          <Button
            variant="outline"
            onClick={handleImport}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Drivers
          </Button>

          <Button
            variant="outline"
            onClick={handleBulkMessage}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Bulk Message
          </Button>

          <Button
            variant="outline"
            onClick={handleReport}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Quick Filters</h4>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
            >
              <Users className="h-3 w-3 mr-1" />
              Active Only
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              License Issues
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Expiring Soon
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
            >
              <Car className="h-3 w-3 mr-1" />
              Available
            </Badge>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Contact Actions</h4>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email All
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Call List
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              SMS All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
