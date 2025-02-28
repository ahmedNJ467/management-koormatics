
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Upload, Download, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ClientDocument, ClientFormValues } from "./types";

interface ClientDetailsProps {
  form: UseFormReturn<ClientFormValues>;
  profilePreview: string | null;
  handleProfileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  documents: ClientDocument[];
  documentFiles: File[];
  handleDocumentUpload: (files: FileList) => void;
  removeDocument: (docId: string) => void;
}

export function ClientDetails({
  form,
  profilePreview,
  handleProfileChange,
  documents,
  documentFiles,
  handleDocumentUpload,
  removeDocument
}: ClientDetailsProps) {
  const clientType = form.watch("type");

  return (
    <div className="space-y-4 mt-4">
      {/* Profile Image Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
          {profilePreview ? (
            <img
              src={profilePreview}
              alt="Profile preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-gray-400" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleProfileChange}
            className="hidden"
            id="profile-upload"
          />
          <label
            htmlFor="profile-upload"
            className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Profile Image</span>
          </label>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <div className="flex space-x-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                {...form.register("type")}
                value="individual"
                className="rounded-full"
              />
              <span>Individual</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                {...form.register("type")}
                value="organization"
                className="rounded-full"
              />
              <span>Organization</span>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" {...form.register("website")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...form.register("address")} />
        </div>
      </div>

      {clientType === "individual" ? (
        // Individual Contact Information
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact">Contact</Label>
            <Input id="contact" {...form.register("contact")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
          </div>
        </div>
      ) : null}

      {/* Document Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Documents</Label>
          <Input
            type="file"
            multiple
            className="hidden"
            id="document-upload"
            onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
          />
          <label
            htmlFor="document-upload"
            className="flex items-center space-x-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Documents</span>
          </label>
        </div>
        <div className="space-y-2">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <span className="text-sm truncate flex-1">{doc.name}</span>
                <div className="flex items-center space-x-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : documentFiles && documentFiles.length > 0 ? (
            // Display pending uploads for new clients
            documentFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <span className="text-sm truncate flex-1">{file.name}</span>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground italic mr-2">Pending upload</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground italic">No documents uploaded</div>
          )}
        </div>
      </div>
    </div>
  );
}
