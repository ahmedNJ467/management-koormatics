
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface MembersHeaderProps {
  onAdd: () => void;
}

export function MembersHeader({ onAdd }: MembersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Label>Organization Members</Label>
      <Button type="button" variant="outline" onClick={onAdd}>
        <UserPlus className="mr-2 h-4 w-4" /> Add Member
      </Button>
    </div>
  );
}
