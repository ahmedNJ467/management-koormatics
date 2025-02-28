
import { MembersList } from "./members-list";
import { MemberDetail } from "./member-detail";
import { MemberForm } from "./member-form";
import { MemberFormValues } from "./types";
import { MembersHeader } from "./members/members-header";
import { useMemberState } from "./members/use-member-state";

interface MembersTabProps {
  members: MemberFormValues[];
  setMembers: (members: MemberFormValues[]) => void;
  clientId?: string;
}

export function MembersTab({ members, setMembers, clientId }: MembersTabProps) {
  const {
    editingMemberIndex,
    isViewingMember,
    setIsViewingMember,
    viewingMemberIndex,
    setViewingMemberIndex,
    isAddingMember,
    memberFormState,
    setMemberFormState,
    addMember,
    editMember,
    viewMember,
    cancelMemberEdit,
    saveMember,
    deleteMember,
    handleMemberDocumentUpload,
    clearMemberDocument
  } = useMemberState(members, setMembers);

  return (
    <div className="space-y-4 mt-4">
      {!isAddingMember ? (
        <>
          <MembersHeader onAddMember={addMember} />
          
          <MembersList 
            members={members} 
            onEdit={editMember}
            onDelete={deleteMember}
            onView={viewMember}
          />
        </>
      ) : (
        <MemberForm 
          isEditing={editingMemberIndex !== null}
          member={memberFormState}
          clientId={clientId}
          onMemberChange={setMemberFormState}
          onCancel={cancelMemberEdit}
          onSave={saveMember}
          onDocumentUploaded={handleMemberDocumentUpload}
          onDocumentClear={clearMemberDocument}
        />
      )}

      {/* Member Detail View Dialog */}
      {viewingMemberIndex !== null && members[viewingMemberIndex] && (
        <MemberDetail
          member={members[viewingMemberIndex]}
          isOpen={isViewingMember}
          onClose={() => {
            setIsViewingMember(false);
            setViewingMemberIndex(null);
          }}
          onEdit={() => {
            setIsViewingMember(false);
            editMember(viewingMemberIndex);
          }}
        />
      )}
    </div>
  );
}
