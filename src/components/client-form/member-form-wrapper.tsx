
import { MemberForm } from "./member-form";
import { MemberFormValues } from "./types";

interface MemberFormWrapperProps {
  isEditing: boolean;
  member: MemberFormValues;
  clientId?: string;
  onMemberChange: (member: MemberFormValues) => void;
  onCancel: () => void;
  onSave: () => void;
  onDocumentUploaded: (url: string, name: string) => void;
  onDocumentClear: () => void;
}

export function MemberFormWrapper({
  isEditing,
  member,
  clientId,
  onMemberChange,
  onCancel,
  onSave,
  onDocumentUploaded,
  onDocumentClear
}: MemberFormWrapperProps) {
  return (
    <MemberForm 
      isEditing={isEditing}
      member={member}
      clientId={clientId}
      onMemberChange={onMemberChange}
      onCancel={onCancel}
      onSave={onSave}
      onDocumentUploaded={onDocumentUploaded}
      onDocumentClear={onDocumentClear}
    />
  );
}
