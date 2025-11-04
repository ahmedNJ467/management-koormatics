import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  User,
  Calendar,
  Gauge,
  Fuel,
  Wrench,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Edit,
  Trash2,
  FileDown,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

interface InspectionDetailsDialogProps {
  inspection: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownloadPdf?: () => void;
}

export function InspectionDetailsDialog({
  inspection,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onDownloadPdf,
}: InspectionDetailsDialogProps) {
  if (!inspection) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pass
          </Badge>
        );
      case "fail":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Fail
          </Badge>
        );
      case "conditional":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Conditional
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFluidBadge = (level: string) => {
    switch (level) {
      case "good":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Good
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Low
          </Badge>
        );
      case "needs_change":
      case "needs_refill":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Needs Attention
          </Badge>
        );
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "good":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Good
          </Badge>
        );
      case "fair":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Fair
          </Badge>
        );
      case "poor":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Poor
          </Badge>
        );
      default:
        return <Badge variant="secondary">{condition}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "EEEE, MMMM do, yyyy") : "Invalid Date";
  };

  const formatDateTime = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date)
      ? format(date, "MMM dd, yyyy 'at' HH:mm")
      : "Invalid Date";
  };

  const CheckIcon = ({ checked }: { checked: boolean }) =>
    checked ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vehicle Inspection Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Inspection Overview
                </div>
                {getStatusBadge(inspection.overall_status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Vehicle
                  </p>
                  <p className="font-medium">
                    {inspection.vehicle
                      ? `${inspection.vehicle.make} ${inspection.vehicle.model}`
                      : "Unknown Vehicle"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {inspection.vehicle?.registration}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Inspector
                  </p>
                  <p className="font-medium">{inspection.inspector_name}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Inspection Date
                  </p>
                  <p className="font-medium">
                    {formatDate(inspection.inspection_date)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Inspection Type
                  </p>
                  <div className="flex gap-2">
                    {inspection.pre_trip && (
                      <Badge variant="outline">Pre-Trip</Badge>
                    )}
                    {inspection.post_trip && (
                      <Badge variant="outline">Post-Trip</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created
                  </p>
                  <p className="text-sm">
                    {formatDateTime(inspection.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Readings */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Vehicle Readings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Mileage
                  </p>
                  <p className="text-2xl font-bold">
                    {inspection.mileage?.toLocaleString()} km
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Fuel Level
                  </p>
                  <p className="text-2xl font-bold">{inspection.fuel_level}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fluid Levels */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Fluid Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Engine Oil</span>
                  {getFluidBadge(inspection.engine_oil)}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Coolant</span>
                  {getFluidBadge(inspection.coolant)}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Brake Fluid</span>
                  {getFluidBadge(inspection.brake_fluid)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Condition */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Vehicle Condition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">Tires Condition</span>
                {getConditionBadge(inspection.tires_condition)}
              </div>
            </CardContent>
          </Card>

          {/* Safety Systems */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Safety Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: "lights_working", label: "Lights Working" },
                  { key: "brakes_working", label: "Brakes Working" },
                  { key: "steering_working", label: "Steering Working" },
                  { key: "horn_working", label: "Horn Working" },
                  { key: "wipers_working", label: "Wipers Working" },
                  { key: "mirrors_clean", label: "Mirrors Clean" },
                  { key: "seatbelts_working", label: "Seatbelts Working" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="font-medium">{item.label}</span>
                    <CheckIcon checked={inspection[item.key]} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Safety Equipment */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Safety Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: "first_aid_kit", label: "First Aid Kit" },
                  { key: "fire_extinguisher", label: "Fire Extinguisher" },
                  { key: "warning_triangle", label: "Warning Triangle" },
                  { key: "jack_spare_tire", label: "Jack & Spare Tire" },
                  { key: "documents_present", label: "Vehicle Documents" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="font-medium">{item.label}</span>
                    <CheckIcon checked={inspection[item.key]} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cleanliness */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Vehicle Cleanliness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Interior Clean</span>
                  <CheckIcon checked={inspection.interior_clean} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Exterior Clean</span>
                  <CheckIcon checked={inspection.exterior_clean} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Actions */}
          {(inspection.defects_noted ||
            inspection.corrective_actions ||
            inspection.notes) && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Notes and Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspection.defects_noted && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-700">Defects Noted</h4>
                    <p className="text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
                      {inspection.defects_noted}
                    </p>
                  </div>
                )}

                {inspection.corrective_actions && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-yellow-700">
                      Corrective Actions Required
                    </h4>
                    <p className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      {inspection.corrective_actions}
                    </p>
                  </div>
                )}

                {inspection.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-700">
                      Additional Notes
                    </h4>
                    <p className="text-sm p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      {inspection.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {(onEdit || onDelete || onDownloadPdf) && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {onDownloadPdf && (
                <Button variant="outline" onClick={onDownloadPdf}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              {onEdit && (
                <Button onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
