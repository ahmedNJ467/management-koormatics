
import { MemberForm } from "./member-form";
import { MemberFormValues } from "./types";

interface MemberFormWrapperProps {
  isEditing: boolean;
  member: MemberFormValues;
  clientId?: string;
  onMemberChange: (member: MemberFormValues) => void;
  onCancel: () => void;
  onSave: () => void;
  onDocumentUploaded: (file: File) => void;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          {isEditing ? "Edit Organization Member" : "Add Organization Member"}
        </h2>
      </div>

      <MemberForm
        member={member}
        isEditing={isEditing}
        onMemberChange={onMemberChange}
        onCancel={onCancel}
        onSave={onSave}
        onDocumentUploaded={onDocumentUploaded}
        onDocumentClear={onDocumentClear}
      />
    </div>
  );
}
