
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DocumentUploadFieldProps {
  documentName: string | null;
  onDocumentChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentClear: () => void;
}

export function DocumentUploadField({ 
  documentName, 
  onDocumentChange, 
  onDocumentClear 
}: DocumentUploadFieldProps) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium">License Document</label>
      <div className="flex items-center space-x-2">
        <Input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={onDocumentChange}
          className="hidden"
          id="document-upload"
        />
        <label
          htmlFor="document-upload"
          className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
        >
          <FileText className="h-4 w-4" />
          <span>{documentName || "Upload Document"}</span>
        </label>
        {documentName && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDocumentClear}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
