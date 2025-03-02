
import { useCallback } from "react";
import { MemberFormValues } from "./types";
import { MemberDocumentUpload } from "./member-document-upload";
import { BasicInfoFields } from "./member-form-fields/basic-info-fields";
import { NotesField } from "./member-form-fields/notes-field";
import { FormActions } from "./member-form-fields/form-actions";
import { FormHeader } from "./member-form-fields/form-header";

interface MemberFormProps {
  isEditing: boolean;
  member: MemberFormValues;
  clientId?: string;
  onMemberChange: (member: MemberFormValues) => void;
  onCancel: () => void;
  onSave: () => void;
  onDocumentUploaded: (url: string, name: string) => void;
  onDocumentClear: () => void;
}

export function MemberForm({
  isEditing,
  member,
  clientId,
  onMemberChange,
  onCancel,
  onSave,
  onDocumentUploaded,
  onDocumentClear
}: MemberFormProps) {
  // Memoize handlers to prevent recreating them on every render
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onMemberChange({...member, name: e.target.value});
  }, [member, onMemberChange]);

  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onMemberChange({...member, role: e.target.value});
  }, [member, onMemberChange]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onMemberChange({...member, email: e.target.value});
  }, [member, onMemberChange]);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onMemberChange({...member, phone: e.target.value});
  }, [member, onMemberChange]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMemberChange({...member, notes: e.target.value});
  }, [member, onMemberChange]);

  const changeHandlers = {
    handleNameChange,
    handleRoleChange,
    handleEmailChange,
    handlePhoneChange
  };

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <FormHeader isEditing={isEditing} onCancel={onCancel} />
      
      <div className="grid grid-cols-2 gap-4">
        <BasicInfoFields 
          member={member} 
          onChange={changeHandlers} 
        />
        
        {/* Document Upload */}
        <div className="col-span-2">
          {clientId ? (
            <MemberDocumentUpload
              documentName={member.document_name || null}
              documentUrl={member.document_url || null}
              clientId={clientId}
              memberId={member.id || crypto.randomUUID()}
              onDocumentUploaded={onDocumentUploaded}
              onDocumentClear={onDocumentClear}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              Document upload will be available after saving the client.
            </div>
          )}
        </div>
        
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
    </div>
  );
}
