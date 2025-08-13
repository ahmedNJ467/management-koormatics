import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentUpload {
  name: string;
  url: string;
  passenger_name: string;
}

interface DocumentUploadsProps {
  passengers: string[];
  serviceType: string;
  editTrip?: any;
}

export function DocumentUploads({
  passengers,
  serviceType,
  editTrip,
}: DocumentUploadsProps) {
  const [passportDocs, setPassportDocs] = useState<DocumentUpload[]>(
    editTrip?.passport_documents || []
  );
  const [invitationDocs, setInvitationDocs] = useState<DocumentUpload[]>(
    editTrip?.invitation_documents || []
  );
  const [uploading, setUploading] = useState(false);

  const isAirportService =
    serviceType === "airport_pickup" || serviceType === "airport_dropoff";
  const validPassengers = passengers.filter((p) => p && p.trim() !== "");

  if (!isAirportService || validPassengers.length === 0) {
    return null;
  }

  const uploadDocument = async (
    file: File,
    passengerName: string,
    docType: "passport" | "invitation"
  ) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${docType}_${passengerName.replace(
        /\s+/g,
        "_"
      )}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("trip_documents")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("trip_documents").getPublicUrl(filePath);

      const newDoc: DocumentUpload = {
        name: file.name,
        url: publicUrl,
        passenger_name: passengerName,
      };

      if (docType === "passport") {
        setPassportDocs((prev) => [...prev, newDoc]);
      } else {
        setInvitationDocs((prev) => [...prev, newDoc]);
      }

      toast.success(
        `${
          docType === "passport" ? "Passport" : "Invitation letter"
        } uploaded successfully`
      );
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (
    doc: DocumentUpload,
    docType: "passport" | "invitation"
  ) => {
    try {
      // Extract file path from URL
      const filePath = doc.url.split("/").pop();
      if (filePath) {
        await supabase.storage.from("trip_documents").remove([filePath]);
      }

      if (docType === "passport") {
        setPassportDocs((prev) => prev.filter((d) => d.url !== doc.url));
      } else {
        setInvitationDocs((prev) => prev.filter((d) => d.url !== doc.url));
      }

      toast.success("Document removed successfully");
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove document");
    }
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    passengerName: string,
    docType: "passport" | "invitation"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload only images (JPG, PNG) or PDF files");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      uploadDocument(file, passengerName, docType);
    }
    // Clear the input
    event.target.value = "";
  };

  const renderDocumentSection = (
    title: string,
    docs: DocumentUpload[],
    docType: "passport" | "invitation"
  ) => (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{title}</h4>
      {validPassengers.map((passenger, index) => {
        const passengerDocs = docs.filter(
          (doc) => doc.passenger_name === passenger
        );
        return (
          <div key={index} className="space-y-2 p-3 rounded-md border">
            <Label className="text-sm font-medium">{passenger}</Label>

            {/* Upload input */}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, passenger, docType)}
                className="h-9"
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>

            {/* Uploaded documents */}
            {passengerDocs.length > 0 && (
              <div className="space-y-2">
                {passengerDocs.map((doc, docIndex) => (
                  <div
                    key={docIndex}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span className="text-sm truncate max-w-[70%]">
                      {doc.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        Open
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(doc, docType)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hidden inputs to pass document data to form */}
      <input
        type="hidden"
        name="passport_documents"
        value={JSON.stringify(passportDocs)}
      />
      <input
        type="hidden"
        name="invitation_documents"
        value={JSON.stringify(invitationDocs)}
      />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Airport Service Documents</h3>
        <div className="grid gap-6">
          {renderDocumentSection("Passport Pictures", passportDocs, "passport")}
          {renderDocumentSection(
            "Invitation Letters",
            invitationDocs,
            "invitation"
          )}
        </div>
      </div>
    </div>
  );
}
