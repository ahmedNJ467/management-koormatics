
import { MembersList } from "./members-list";
import { MemberFormValues } from "./types";
import { MemberFormWrapper } from "./member-form-wrapper";
import { MemberViewWrapper } from "./member-view-wrapper";
import { MembersHeader } from "./members-header";
import { useMembers } from "./hooks/use-members";

interface MembersTabProps {
  members: MemberFormValues[];
  setMembers: (members: MemberFormValues[]) => void;
  clientId?: string;
}

export function MembersTab({ members, setMembers, clientId }: MembersTabProps) {
  const {
    memberFormState,
    setMemberFormState,
    editingMemberIndex,
    isViewingMember,
    viewingMemberIndex,
    isAddingMember,
    addMember,
    editMember,
    viewMember,
    handleCloseViewDialog,
    cancelMemberEdit,
    saveMember,
    deleteMember,
    handleMemberDocumentUpload,
    clearMemberDocument
  } = useMembers(members, setMembers);

  return (
    <div className="space-y-4 mt-4">
      {!isAddingMember ? (
        <>
          <MembersHeader onAdd={addMember} />
          
          <MembersList 
            members={members} 
            onEdit={editMember}
            onDelete={deleteMember}
            onView={viewMember}
          />
        </>
      ) : (
        <MemberFormWrapper 
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

      {/* MemberViewWrapper with conditional rendering */}
      <MemberViewWrapper
        isViewing={isViewingMember}
        member={viewingMemberIndex !== null && viewingMemberIndex < members.length 
          ? members[viewingMemberIndex] 
          : null}
        onClose={handleCloseViewDialog}
        onEdit={() => {
          handleCloseViewDialog();
          if (viewingMemberIndex !== null) {
            editMember(viewingMemberIndex);
          }
        }}
        onDelete={() => {
          handleCloseViewDialog();
          if (viewingMemberIndex !== null) {
            deleteMember(viewingMemberIndex);
          }
        }}
      />
    </div>
  );
}
