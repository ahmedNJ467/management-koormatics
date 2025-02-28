
import { FileText, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { uploadMemberDocument } from "./use-member-uploads";

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
  const [isUploading, setIsUploading] = useState(false);

  const handleDocumentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !clientId || !memberId) return;
    
    try {
      setIsUploading(true);
      const result = await uploadMemberDocument(file, clientId, memberId);
      onDocumentUploaded(result.url, result.name);
    } catch (error) {
      console.error("Failed to upload document:", error);
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
          <FileText className="h-4 w-4" />
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
