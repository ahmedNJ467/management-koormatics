import { FileText, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DocumentUploadFieldProps {
  documentName: string | null;
  documentUrl?: string | null;
  onDocumentChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentClear: () => void;
}

export function DocumentUploadField({
  documentName,
  documentUrl,
  onDocumentChange,
  onDocumentClear,
}: DocumentUploadFieldProps) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium">License Document</label>
      <div className="flex items-center space-x-2">
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={onDocumentChange}
          className="hidden"
          id="document-upload"
        />
        <label
          htmlFor="document-upload"
          className="flex items-center space-x-2 px-4 py-2 rounded-md border border-border/50 cursor-pointer bg-transparent hover:bg-muted/50 text-foreground"
        >
          <FileText className="h-4 w-4" />
          <span>{documentName || "Upload Document"}</span>
        </label>
        {documentName && (
          <div className="flex items-center space-x-2">
            {documentUrl && (
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-2 py-1 text-sm text-primary hover:text-primary/80"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </a>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDocumentClear}
              className="border-border/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
