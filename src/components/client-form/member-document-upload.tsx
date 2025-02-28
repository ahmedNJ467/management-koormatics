
import { FileText, Download, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { uploadMemberDocument } from "./use-member-uploads";
import { useToast } from "@/hooks/use-toast";

interface MemberDocumentUploadProps {
  documentName: string | null;
  documentUrl: string | null;
  clientId?: string;
  memberId?: string;
  onDocumentUploaded: (url: string, name: string) => void;
  onDocumentClear: () => void;
}

export function MemberDocumentUpload({ 
  documentName, 
  documentUrl,
  clientId,
  memberId,
  onDocumentUploaded, 
  onDocumentClear 
}: MemberDocumentUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.error("No file selected for upload");
      return;
    }
    
    if (!clientId) {
      console.error("Missing clientId for document upload");
      toast({
        title: "Upload Error",
        description: "Client ID is missing. Please save the client first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!memberId) {
      console.error("Missing memberId for document upload");
      // Use a random UUID if the member hasn't been saved yet
      const tempMemberId = crypto.randomUUID();
      console.log("Generated temporary member ID:", tempMemberId);
    }
    
    const actualMemberId = memberId || crypto.randomUUID();
    
    try {
      setIsUploading(true);
      console.log(`Uploading document for client ${clientId}, member ${actualMemberId}, file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      const result = await uploadMemberDocument(file, clientId, actualMemberId);
      
      console.log("Upload result:", result);
      onDocumentUploaded(result.url, result.name);
      
      toast({
        title: "Document uploaded",
        description: "Member document has been uploaded successfully."
      });
    } catch (error) {
      console.error("Failed to upload document:", error);
      
      toast({
        title: "Upload failed",
        description: "Failed to upload member document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium">Document / ID / Passport</label>
      <div className="flex items-center space-x-2">
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleDocumentChange}
          className="hidden"
          id="member-document-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="member-document-upload"
          className={`flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>{isUploading ? "Uploading..." : documentName || "Upload Document"}</span>
        </label>
        {documentName && !isUploading && (
          <div className="flex items-center space-x-2">
            {documentUrl && (
              <a 
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Download className="h-4 w-4" />
                <span>View</span>
              </a>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDocumentClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
