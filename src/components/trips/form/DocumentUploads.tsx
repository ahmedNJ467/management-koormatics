import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Trash, Download } from "lucide-react";
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

export function DocumentUploads({ passengers, serviceType, editTrip }: DocumentUploadsProps) {
  const [passportDocs, setPassportDocs] = useState<DocumentUpload[]>(
    editTrip?.passport_documents || []
  );
  const [invitationDocs, setInvitationDocs] = useState<DocumentUpload[]>(
    editTrip?.invitation_documents || []
  );
  const [uploading, setUploading] = useState(false);

  const isAirportService = serviceType === "airport_pickup" || serviceType === "airport_dropoff";
  const validPassengers = passengers.filter(p => p && p.trim() !== "");

  if (!isAirportService || validPassengers.length === 0) {
    return null;
  }

  const uploadDocument = async (
    file: File, 
    passengerName: string, 
    docType: 'passport' | 'invitation'
  ) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${docType}_${passengerName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('trip_documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('trip_documents')
        .getPublicUrl(filePath);

      const newDoc: DocumentUpload = {
        name: file.name,
        url: publicUrl,
        passenger_name: passengerName
      };

      if (docType === 'passport') {
        setPassportDocs(prev => [...prev, newDoc]);
      } else {
        setInvitationDocs(prev => [...prev, newDoc]);
      }

      toast.success(`${docType === 'passport' ? 'Passport' : 'Invitation letter'} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (
    doc: DocumentUpload, 
    docType: 'passport' | 'invitation'
  ) => {
    try {
      // Extract file path from URL
      const filePath = doc.url.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('trip_documents')
          .remove([filePath]);
      }

      if (docType === 'passport') {
        setPassportDocs(prev => prev.filter(d => d.url !== doc.url));
      } else {
        setInvitationDocs(prev => prev.filter(d => d.url !== doc.url));
      }

      toast.success('Document removed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove document');
    }
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    passengerName: string,
    docType: 'passport' | 'invitation'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload only images (JPG, PNG) or PDF files');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      uploadDocument(file, passengerName, docType);
    }
    // Clear the input
    event.target.value = '';
  };

  const renderDocumentSection = (
    title: string,
    docs: DocumentUpload[],
    docType: 'passport' | 'invitation'
  ) => (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validPassengers.map((passenger, index) => {
          const passengerDocs = docs.filter(doc => doc.passenger_name === passenger);
          
          return (
            <div key={index} className="space-y-2 p-3 border rounded-md">
              <Label className="text-sm font-medium">{passenger}</Label>
              
              {/* Upload button */}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, passenger, docType)}
                  className="hidden"
                  id={`${docType}-${index}`}
                  disabled={uploading}
                />
                <Label
                  htmlFor={`${docType}-${index}`}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 text-sm"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : `Upload ${title.slice(0, -1)}`}
                </Label>
              </div>

              {/* Uploaded documents */}
              {passengerDocs.length > 0 && (
                <div className="space-y-2">
                  {passengerDocs.map((doc, docIndex) => (
                    <div key={docIndex} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(doc, docType)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
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
        <h3 className="text-lg font-medium">Airport Service Documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload passport pictures and invitation letters for airport pickup/dropoff services.
        </p>

        <div className="grid gap-6">
          {renderDocumentSection("Passport Pictures", passportDocs, "passport")}
          {renderDocumentSection("Invitation Letters", invitationDocs, "invitation")}
        </div>
      </div>
    </div>
  );
} 