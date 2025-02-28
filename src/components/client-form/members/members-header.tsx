
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface MembersHeaderProps {
  onAddMember: () => void;
}

export function MembersHeader({ onAddMember }: MembersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Label>Organization Members</Label>
      <Button type="button" variant="outline" onClick={onAddMember}>
        <UserPlus className="mr-2 h-4 w-4" /> Add Member
      </Button>
    </div>
  );
}
