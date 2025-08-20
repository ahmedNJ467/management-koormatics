
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";

interface MemberDocumentUploadProps {
  documentUrl?: string;
  documentName?: string;
  onDocumentUploaded: (file: File) => void;
  onDocumentCleared: () => void;
}

export function MemberDocumentUpload({
  documentUrl,
  documentName,
  onDocumentUploaded,
  onDocumentCleared
}: MemberDocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onDocumentUploaded(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onDocumentUploaded(files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="document-upload">Document Upload</Label>
      
      {documentUrl ? (
        <div className="flex items-center space-x-2 p-2 border rounded">
          <FileText className="h-5 w-5 text-blue-500" />
          <a 
            href={documentUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:underline flex-1 truncate"
          >
            {documentName || "Document"}
          </a>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onDocumentCleared}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragging ? "border-primary bg-primary/10" : "border-muted"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("document-upload")?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drag and drop a file, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, Word, or image files accepted
              </p>
            </div>
          </div>
          <input
            id="document-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
        </div>
      )}
    </div>
  );
}
