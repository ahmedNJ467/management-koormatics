
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { DriverFormValues } from "./types";
import { AvatarUploadField } from "./avatar-upload-field";
import { DocumentUploadField } from "./document-upload-field";
import { DriverFields } from "./driver-fields";
import type { Driver } from "@/lib/types";

interface DriverFormContentProps {
  form: UseFormReturn<DriverFormValues>;
  driver: Driver | undefined;
  isSubmitting: boolean;
  avatarPreview: string | null;
  documentName: string | null;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentClear: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onSubmit: (values: DriverFormValues) => Promise<void>;
}

export function DriverFormContent({
  form,
  driver,
  isSubmitting,
  avatarPreview,
  documentName,
  onAvatarChange,
  onDocumentChange,
  onDocumentClear,
  onCancel,
  onDelete,
  onSubmit,
}: DriverFormContentProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <AvatarUploadField
          avatarPreview={avatarPreview}
          onAvatarChange={onAvatarChange}
        />

        <DocumentUploadField
          documentName={documentName}
          documentUrl={driver?.document_url}
          onDocumentChange={onDocumentChange}
          onDocumentClear={onDocumentClear}
        />

        <DriverFields form={form} />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {driver && (
            <Button 
              type="button"
              variant="destructive"
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : driver ? "Update Driver" : "Add Driver"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
