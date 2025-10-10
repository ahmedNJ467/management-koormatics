import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Car,
  User,
  MapPin,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  Shield,
  Camera,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

interface VehicleIncidentReport {
  id: string;
  vehicle_id: string;
  driver_id?: string;
  incident_date: string;
  incident_time: string;
  incident_type:
    | "accident"
    | "theft"
    | "vandalism"
    | "breakdown"
    | "traffic_violation"
    | "other";
  severity: "minor" | "moderate" | "severe" | "critical";
  status: "reported" | "investigating" | "resolved" | "closed";
  location: string;
  description: string;
  injuries_reported: boolean;
  police_report_number?: string;
  insurance_claim_number?: string;
  estimated_damage_cost?: number;
  actual_repair_cost?: number;
  third_party_involved: boolean;
  third_party_details?: string;
  witness_details?: string;
  photos_attached: boolean;
  reported_by: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  notes?: string;

  created_at: string;
  updated_at: string;
  vehicle?: {
    make: string;
    model: string;
    registration: string;
  };
  driver?: {
    name: string;
    license_number: string;
  };
}

interface IncidentDetailsDialogProps {
  report: VehicleIncidentReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentDetailsDialog({
  report,
  open,
  onOpenChange,
}: IncidentDetailsDialogProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "minor":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "moderate":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "severe":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Fetch incident images from DB
  const { data: incidentImages } = useQuery({
    queryKey: ["incident-images", report?.id],
    enabled: !!report?.id,
    queryFn: async () => {
      if (!report?.id) return [];
      const { data, error } = await supabase
        .from("vehicle_incident_images")
        .select("image_url, name")
        .eq("incident_id", report.id);
      if (error) throw error;
      return data || [];
    },
  });

  if (!report) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "minor":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Minor
          </Badge>
        );
      case "moderate":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Moderate
          </Badge>
        );
      case "severe":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            Severe
          </Badge>
        );
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Critical
          </Badge>
        );
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reported":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Reported
          </Badge>
        );
      case "investigating":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Investigating
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Resolved
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Closed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      accident: "Accident",
      theft: "Theft",
      vandalism: "Vandalism",
      breakdown: "Breakdown",
      traffic_violation: "Traffic Violation",
      other: "Other",
    };

    const typeColors = {
      accident: "bg-red-100 text-red-800",
      theft: "bg-purple-100 text-purple-800",
      vandalism: "bg-orange-100 text-orange-800",
      breakdown: "bg-blue-100 text-blue-800",
      traffic_violation: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge
        className={`${typeColors[type as keyof typeof typeColors]} hover:${
          typeColors[type as keyof typeof typeColors]
        }`}
      >
        {typeLabels[type as keyof typeof typeLabels] || type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "EEEE, MMMM do, yyyy") : "Invalid Date";
  };

  const formatShortDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid Date";
  };

  const formatDateTime = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date)
      ? format(date, "dd/MM/yyyy 'at' HH:mm")
      : "Invalid Date";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Incident Report Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive details of the vehicle incident report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getSeverityIcon(report.severity)}
                  Incident Overview
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getTypeBadge(report.incident_type)}
                  {getSeverityBadge(report.severity)}
                  {getStatusBadge(report.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatShortDate(report.incident_date)}
                    </p>
                  </div>
                </div>

                {report.incident_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {report.incident_time}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {report.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Reported By</p>
                    <p className="text-sm text-muted-foreground">
                      {report.reported_by}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle and Driver Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.vehicle ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Vehicle</p>
                      <p className="text-sm text-muted-foreground">
                        {report.vehicle.make} {report.vehicle.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Registration</p>
                      <p className="text-sm text-muted-foreground">
                        {report.vehicle.registration}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Vehicle information not available
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.driver ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Driver Name</p>
                      <p className="text-sm text-muted-foreground">
                        {report.driver.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">License Number</p>
                      <p className="text-sm text-muted-foreground">
                        {report.driver.license_number}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No driver specified
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Incident Description */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Incident Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{report.description}</p>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Estimated Damage Cost</p>
                  <p className="text-sm text-muted-foreground">
                    {report.estimated_damage_cost
                      ? `$${report.estimated_damage_cost.toLocaleString()}`
                      : "Not assessed"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Actual Repair Cost</p>
                  <p className="text-sm text-muted-foreground">
                    {report.actual_repair_cost
                      ? `$${report.actual_repair_cost.toLocaleString()}`
                      : "Not available"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Official Reports */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Official Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Police Report Number</p>
                  <p className="text-sm text-muted-foreground">
                    {report.police_report_number || "Not available"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Insurance Claim Number</p>
                  <p className="text-sm text-muted-foreground">
                    {report.insurance_claim_number || "Not available"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      report.injuries_reported ? "bg-red-500" : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm">
                    {report.injuries_reported
                      ? "Injuries Reported"
                      : "No Injuries"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      report.third_party_involved
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm">
                    {report.third_party_involved
                      ? "Third Party"
                      : "No Third Party"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera
                    className={`w-4 h-4 ${
                      report.photos_attached
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="text-sm">
                    {report.photos_attached ? "Photos Available" : "No Photos"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      report.follow_up_required
                        ? "bg-orange-500"
                        : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm">
                    {report.follow_up_required
                      ? "Follow-up Required"
                      : "No Follow-up"}
                  </span>
                </div>
              </div>

              {report.third_party_involved && report.third_party_details && (
                <div>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Third Party Details
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.third_party_details}
                    </p>
                  </div>
                </div>
              )}

              {report.witness_details && (
                <div>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Witness Information
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.witness_details}
                    </p>
                  </div>
                </div>
              )}

              {report.follow_up_required && report.follow_up_date && (
                <div>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium">Follow-up Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(report.follow_up_date)}
                    </p>
                  </div>
                </div>
              )}

              {report.notes && (
                <div>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium mb-2">Additional Notes</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.notes}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incident Photos */}
          {incidentImages && incidentImages.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Incident Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {incidentImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="aspect-square bg-muted">
                        <img
                          src={(img as any).image_url}
                          alt={(img as any).name || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {(img as any).name && (
                        <div className="px-2 py-1 text-xs text-muted-foreground truncate">
                          {(img as any).name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Created: {formatDateTime(report.created_at)}</span>
                <span>Updated: {formatDateTime(report.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
