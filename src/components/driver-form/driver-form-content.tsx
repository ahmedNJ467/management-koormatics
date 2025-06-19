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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Profile Section */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Profile</h3>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-4">
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
            </div>
            <div className="flex-[2] w-full">
              <DriverFields form={form} />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancel
          </Button>
          {driver && (
            <Button type="button" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="default"
            className="w-full sm:w-auto font-semibold shadow"
          >
            {isSubmitting
              ? "Saving..."
              : driver
              ? "Update Driver"
              : "Add Driver"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
