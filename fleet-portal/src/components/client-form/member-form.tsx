
import React from "react";
import { useForm } from "react-hook-form";
import { FormHeader } from "./member-form-fields/form-header";
import { BasicInfoFields } from "./member-form-fields/basic-info-fields";
import { NotesField } from "./member-form-fields/notes-field";
import { FormActions } from "./member-form-fields/form-actions";
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMemberChange({ ...member, name: e.target.value });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMemberChange({ ...member, role: e.target.value });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMemberChange({ ...member, email: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMemberChange({ ...member, phone: e.target.value });
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMemberChange({ ...member, notes: e.target.value });
  };

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
      <FormHeader isEditing={isEditing} onCancel={onCancel} />
      
      <div className="grid gap-6">
        <BasicInfoFields 
          member={member} 
          onChange={{
            handleNameChange,
            handleRoleChange,
            handleEmailChange,
            handlePhoneChange
          }} 
        />
        
        <MemberDocumentUpload
          documentUrl={member.document_url}
          documentName={member.document_name}
          onDocumentUploaded={onDocumentUploaded}
          onDocumentCleared={onDocumentClear}
        />
        
        <NotesField 
          value={member.notes || ""} 
          onChange={handleNotesChange} 
        />
      </div>
      
      <FormActions
        isEditing={isEditing}
        onCancel={onCancel}
        onSave={onSave}
      />
    </form>
  );
}
