
import { MemberDetail } from "./member-detail";
import { MemberFormValues } from "./types";

interface MemberViewWrapperProps {
  isViewing: boolean;
  member: MemberFormValues | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MemberViewWrapper({ 
  isViewing, 
  member, 
  onClose, 
  onEdit,
  onDelete
}: MemberViewWrapperProps) {
  // Early return if not viewing or no member
  if (!isViewing || !member) return null;

  return (
    <MemberDetail
      member={member}
      isOpen={isViewing}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
