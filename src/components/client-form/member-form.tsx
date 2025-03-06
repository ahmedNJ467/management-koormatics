
import React from "react";
import { useForm } from "react-hook-form";
import { MemberFormHeader } from "./member-form-fields/form-header";
import { MemberBasicInfoFields } from "./member-form-fields/basic-info-fields";
import { MemberNotesField } from "./member-form-fields/notes-field";
import { MemberFormActions } from "./member-form-fields/form-actions";
import { MemberFormValues } from "./types";
import { MemberDocumentUpload } from "./member-document-upload";

interface MemberFormProps {
  member: MemberFormValues;
  isEditing: boolean;
  onMemberChange: (member: MemberFormValues) => void;
  onCancel: () => void;
  onSave: () => void;
  onDocumentUploaded: (file: File) => void;
  onDocumentClear: () => void;
}

export function MemberForm({
  member,
  isEditing,
  onMemberChange,
  onCancel,
  onSave,
  onDocumentUploaded,
  onDocumentClear
}: MemberFormProps) {
  // Create a form context using react-hook-form
  const form = useForm<MemberFormValues>({
    defaultValues: member,
  });

  // Watch the form values to update the parent component
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onMemberChange(value as MemberFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form, onMemberChange]);

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
      <MemberFormHeader isEditing={isEditing} />
      
      <div className="grid gap-6">
        <MemberBasicInfoFields form={form} />
        
        <MemberDocumentUpload
          documentUrl={member.document_url}
          documentName={member.document_name}
          onDocumentUploaded={onDocumentUploaded}
          onDocumentCleared={onDocumentClear}
        />
        
        <MemberNotesField form={form} />
      </div>
      
      <MemberFormActions
        onCancel={onCancel}
        isEditing={isEditing}
        isSubmitting={form.formState.isSubmitting}
      />
    </form>
  );
}
